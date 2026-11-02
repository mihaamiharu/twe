/* eslint-disable security/detect-non-literal-fs-filename -- Snapshot, fixture and report paths are required to be private; D1 is an explicit disposable rehearsal. */
import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  assertPrivatePath,
  hashRows,
  rowSchema,
  snapshotSchema,
  writePrivate,
} from './model';

const [snapshotPath, reportPath, fixturePath] = process.argv.slice(2);
if (!snapshotPath || !reportPath || !fixturePath)
  throw new Error(
    'Usage: check-account-compatibility.ts /private/snapshot.json /private/report.json /private/legacy-synthetic-fixture.json',
  );
for (const path of [snapshotPath, reportPath, fixturePath])
  assertPrivatePath(path);
if (!process.env['TWE_WRANGLER_CONFIG']?.includes('/.wrangler/test-runs/run-'))
  throw new Error('Account checks require the disposable migration rehearsal.');
const state = process.env['TWE_D1_PERSIST'];
if (!state) throw new Error('Private disposable D1 state is required.');
assertPrivatePath(state);

const snapshot = snapshotSchema.parse(
  JSON.parse(await readFile(snapshotPath, 'utf8')) as unknown,
);
const fixture = z
  .object({
    format: z.literal('twe-legacy-auth-synthetic-v1'),
    legacyVersion: z.string(),
    password: z.string().startsWith('Synthetic-only-'),
    hash: z.string().regex(/^[a-f0-9]{32}:[a-f0-9]{128}$/),
    secret: z.string().startsWith('synthetic-legacy-cookie-secret-').min(32),
    token: z.string().startsWith('synthetic-legacy-session-token-'),
    cookie: z.string().startsWith('__Secure-better-auth.session_token='),
  })
  .parse(JSON.parse(await readFile(fixturePath, 'utf8')) as unknown);

const { getRuntimeEnv, closeRuntime } = await import('#platform');
const env = getRuntimeEnv();
if (env.APP_ENV !== 'test' || env.EMAIL_PROVIDER !== 'disabled') {
  await closeRuntime();
  throw new Error(
    'Account checks require test mode with outbound delivery disabled.',
  );
}
const { db, users, accounts, sessions } = await import('../../src/db');
const { auth } = await import('../../src/server/auth.server');
const original = { secret: env.BETTER_AUTH_SECRET, url: env.BETTER_AUTH_URL };
const id = crypto.randomUUID();
const email = `migration-${id}@example.invalid`;
const legacySessionId = crypto.randomUUID();
const report = {
  completed: false,
  sourceCommit: snapshot.sourceCommit,
  legacyBetterAuthVersion: fixture.legacyVersion,
  sourceUserCount: snapshot.tables['users']?.count ?? 0,
  sourceAccountCount: snapshot.tables['accounts']?.count ?? 0,
  sourceSessionCount: snapshot.tables['sessions']?.count ?? 0,
  credentialHashCount: 0,
  googleAccountCount: 0,
  sourceAuthRowsMatchedBefore: false,
  sourceAuthRowsMatchedAfter: false,
  duplicateNormalizedEmails: 0,
  duplicateProviderIdentities: 0,
  legacyPasswordAndNormalizationAccepted: false,
  wrongPasswordRejected: false,
  legacySignedCookieAccepted: false,
  tamperedCookieRejected: false,
  expiredSessionRejected: false,
  syntheticFixturesRemoved: false,
  realExistingPasswordLoginPerformed: false,
  liveGoogleCallbackPerformed: false,
  productionSecretUsed: false,
  failure: '',
};
function requireCheck(value: unknown): asserts value {
  if (!value) throw new Error('Account compatibility assertion failed.');
}
async function sourceAuthRowsMatch() {
  for (const name of ['users', 'accounts', 'sessions'] as const) {
    // eslint-disable-next-line security/detect-object-injection -- name is one of three fixed auth table literals.
    const expected = snapshot.tables[name];
    requireCheck(expected);
    const values = await env.DB.prepare(`SELECT * FROM "${name}"`).all();
    const rows = values.results.map((row) => rowSchema.parse(row));
    requireCheck(
      rows.length === expected.count && hashRows(rows) === expected.sha256,
    );
  }
  return true;
}
function duplicateCount(values: string[]) {
  return values.length - new Set(values).size;
}
function request(path: string, body?: object, cookie?: string) {
  return new Request(`${env.BETTER_AUTH_URL}/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: env.BETTER_AUTH_URL,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
try {
  report.sourceAuthRowsMatchedBefore = await sourceAuthRowsMatch();
  const originalUsers = snapshot.tables['users']!.rows;
  const originalAccounts = snapshot.tables['accounts']!.rows;
  report.duplicateNormalizedEmails = duplicateCount(
    originalUsers.map((row) => String(row['email']).toLowerCase()),
  );
  report.duplicateProviderIdentities = duplicateCount(
    originalAccounts.map((row) =>
      JSON.stringify([row['provider_id'], row['account_id']]),
    ),
  );
  requireCheck(
    report.duplicateNormalizedEmails === 0 &&
      report.duplicateProviderIdentities === 0,
  );
  const credentials = originalAccounts.filter(
    (row) => row['provider_id'] === 'credential',
  );
  report.credentialHashCount = credentials.length;
  report.googleAccountCount = originalAccounts.filter(
    (row) => row['provider_id'] === 'google',
  ).length;
  requireCheck(
    credentials.every(
      (row) =>
        typeof row['password'] === 'string' &&
        /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(row['password']),
    ),
  );

  env.BETTER_AUTH_SECRET = fixture.secret;
  env.BETTER_AUTH_URL = 'https://migration-rehearsal.example.invalid';
  await db
    .insert(users)
    .values({
      id,
      email,
      name: 'Synthetic legacy migration check',
      emailVerified: true,
      role: 'ADMIN',
    });
  await db
    .insert(accounts)
    .values({
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: fixture.hash,
    });
  const wrong = await auth.handler(
    request('sign-in/email', {
      email,
      password: 'Synthetic-only-wrong-password',
    }),
  );
  requireCheck(wrong.status === 401);
  report.wrongPasswordRejected = true;
  const login = await auth.handler(
    request('sign-in/email', {
      email,
      password: fixture.password.normalize('NFD'),
    }),
  );
  requireCheck(login.ok);
  const loginCookie = login.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  const sessionResponse = await auth.handler(
    request('get-session', undefined, loginCookie),
  );
  const identity = z
    .object({ user: z.object({ id: z.string(), role: z.string() }) })
    .parse((await sessionResponse.json()) as unknown);
  requireCheck(identity.user.id === id && identity.user.role === 'ADMIN');
  const stored = await db.query.accounts.findFirst({
    where: eq(accounts.userId, id),
  });
  requireCheck(stored?.password === fixture.hash);
  report.legacyPasswordAndNormalizationAccepted = true;

  const now = Date.now();
  await db
    .insert(sessions)
    .values({
      id: legacySessionId,
      userId: id,
      token: fixture.token,
      expiresAt: new Date(now + 3_600_000),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  const legacyCookie = fixture.cookie.split(';')[0]!;
  const legacyResponse = await auth.handler(
    request('get-session', undefined, legacyCookie),
  );
  const legacyIdentity = z
    .object({ user: z.object({ id: z.string(), role: z.string() }) })
    .parse((await legacyResponse.json()) as unknown);
  requireCheck(
    legacyIdentity.user.id === id && legacyIdentity.user.role === 'ADMIN',
  );
  report.legacySignedCookieAccepted = true;
  const tampered = await auth.handler(
    request(
      'get-session',
      undefined,
      legacyCookie.replace(fixture.token, `${fixture.token}-tampered`),
    ),
  );
  requireCheck((await tampered.json()) === null);
  report.tamperedCookieRejected = true;
  await db
    .update(sessions)
    .set({ expiresAt: new Date(now - 60_000) })
    .where(eq(sessions.id, legacySessionId));
  const expired = await auth.handler(
    request('get-session', undefined, legacyCookie),
  );
  requireCheck((await expired.json()) === null);
  report.expiredSessionRejected = true;
} catch {
  report.failure =
    'Account compatibility check failed; no credential or user data is included in this report.';
  process.exitCode = 1;
} finally {
  try {
    // Delete only this random synthetic identity; FKs remove its account/session fixtures.
    const ownUser = await db.query.users.findFirst({ where: eq(users.id, id) });
    requireCheck(!ownUser || ownUser.email === email);
    if (ownUser) await db.delete(users).where(eq(users.id, id));
    requireCheck(
      !(await db.query.users.findFirst({ where: eq(users.id, id) })),
    );
    report.syntheticFixturesRemoved = true;
    report.sourceAuthRowsMatchedAfter = await sourceAuthRowsMatch();
  } catch {
    report.failure =
      'Synthetic cleanup or source-row reconciliation failed; retain the isolated target for investigation.';
    process.exitCode = 1;
  }
  env.BETTER_AUTH_SECRET = original.secret;
  env.BETTER_AUTH_URL = original.url;
  report.completed =
    !report.failure &&
    report.legacyPasswordAndNormalizationAccepted &&
    report.legacySignedCookieAccepted &&
    report.sourceAuthRowsMatchedAfter;
  await closeRuntime();
  await writePrivate(reportPath, report);
}
console.log(
  JSON.stringify({
    event: 'isolated_account_compatibility_checked',
    completed: report.completed,
    sourceUsers: report.sourceUserCount,
    credentialHashes: report.credentialHashCount,
    googleAccounts: report.googleAccountCount,
  }),
);
