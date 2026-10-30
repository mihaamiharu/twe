/* eslint-disable security/detect-non-literal-fs-filename -- Input credentials and output report are restricted outside the checkout. */
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { readJsonConfig } from './json-config';
import { assertPrivatePath, writePrivate } from './migration/model';

const [secretsPath, accountsPath, reportPath] = process.argv.slice(2);
if (!secretsPath || !accountsPath || !reportPath)
  throw new Error(
    'Usage: bun scripts/smoke-preview.ts /private/secrets.json /private/accounts.json /private/new-report.json',
  );
for (const path of [secretsPath, accountsPath, reportPath])
  assertPrivatePath(path);
const secrets = z
  .object({ PREVIEW_ACCESS_TOKEN: z.string().min(32) })
  .parse(JSON.parse(await readFile(secretsPath, 'utf8')) as unknown);
const accounts = z
  .object({
    target: z.literal('twe-preview'),
    databaseId: z.string().uuid(),
    credentials: z.array(
      z.object({
        role: z.enum(['USER', 'ADMIN']),
        email: z.string().endsWith('@example.invalid'),
        password: z.string().min(20),
      }),
    ),
  })
  .parse(JSON.parse(await readFile(accountsPath, 'utf8')) as unknown);
const config = z
  .object({
    env: z.object({
      preview: z.object({
        name: z.literal('twe-preview'),
        vars: z.object({ BETTER_AUTH_URL: z.string().url() }),
        d1_databases: z.array(
          z.object({ binding: z.string(), database_id: z.string() }),
        ),
      }),
    }),
  })
  .parse(await readJsonConfig('wrangler.jsonc'));
const base = new URL(config.env.preview.vars.BETTER_AUTH_URL);
if (
  base.protocol !== 'https:' ||
  !base.hostname.startsWith('twe-preview.') ||
  !base.hostname.endsWith('.workers.dev') ||
  accounts.databaseId !==
    config.env.preview.d1_databases.find((item) => item.binding === 'DB')
      ?.database_id
)
  throw new Error(
    'Smoke credentials and the isolated preview target do not match.',
  );
const authorization = `Basic ${btoa(`preview:${secrets.PREVIEW_ACCESS_TOKEN}`)}`;
const report = {
  completed: false,
  target: base.origin,
  requests: [] as {
    label: string;
    status: number;
    wallMs: number;
    bytes: number;
  }[],
  failure: '',
};
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function request(
  label: string,
  path: string,
  options: RequestInit = {},
  access = true,
) {
  const url = new URL(path, base);
  check(
    url.origin === base.origin,
    'Preview smoke cannot follow another origin.',
  );
  const headers = new Headers(options.headers);
  if (access) headers.set('Authorization', authorization);
  const started = performance.now();
  const response = await fetch(url, {
    ...options,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(60_000),
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  report.requests.push({
    label,
    status: response.status,
    wallMs: Math.round(performance.now() - started),
    bytes: bytes.length,
  });
  check(
    response.headers.get('x-robots-tag') === 'noindex, nofollow',
    `${label}: preview noindex missing.`,
  );
  check(
    response.headers.get('cache-control')?.includes('private'),
    `${label}: private cache policy missing.`,
  );
  return { response, bytes };
}
function png(bytes: Uint8Array) {
  check(bytes.length >= 24, 'PNG is incomplete.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  check(
    view.getUint32(0) === 0x89504e47 &&
      view.getUint32(16) === 1200 &&
      view.getUint32(20) === 630,
    'PNG header/dimensions differ.',
  );
}
try {
  for (const path of ['/en', '/esbuild.wasm']) {
    const result = await request('unauthorized access', path, {}, false);
    check(result.response.status === 401, 'Preview access bypassed the gate.');
  }
  for (const path of [
    '/en',
    '/id',
    '/en/learn',
    '/en/practice',
    '/robots.txt',
    '/sitemap.xml',
    '/esbuild.wasm',
  ]) {
    const result = await request(path, path);
    check(result.response.status === 200, `${path}: expected 200.`);
  }
  const known = await request('legacy OG redirect', '/api/og?type=Home');
  const location = known.response.headers.get('location');
  check(
    known.response.status === 302 &&
      typeof location === 'string' &&
      location.startsWith('/og/'),
    'Legacy OG redirect failed.',
  );
  png((await request('known OG asset', location)).bytes);
  const dynamic = await request(
    'custom OG render',
    '/api/og?type=Challenge&title=Synthetic%20preview%20runtime&xp=0',
  );
  check(dynamic.response.status === 200, 'Dynamic OG failed.');
  png(dynamic.bytes);
  const denied = await request(
    'test support API denied',
    '/api/test/seed-user',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base.origin },
      body: '{}',
    },
  );
  check(
    [403, 404].includes(denied.response.status),
    'Test support API is enabled in preview.',
  );
  for (const role of ['USER', 'ADMIN'] as const) {
    const account = accounts.credentials.find((item) => item.role === role);
    check(account, 'Synthetic preview account is missing.');
    const login = await request(`${role} login`, '/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base.origin },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    });
    check(
      login.response.status === 200,
      `${role}: login failed (${login.response.status}).`,
    );
    const cookies = login.response.headers.getSetCookie();
    const sessionCookie = cookies.find((cookie) =>
      cookie.includes('session_token='),
    );
    check(
      sessionCookie &&
        /;\s*HttpOnly/i.test(sessionCookie) &&
        /;\s*Secure/i.test(sessionCookie) &&
        /;\s*SameSite=Lax/i.test(sessionCookie),
      'Session cookie flags differ.',
    );
    const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
    try {
      const session = await request(
        `${role} session`,
        '/api/auth/get-session',
        { headers: { Cookie: cookie } },
      );
      check(session.response.status === 200, 'Session lookup failed.');
      const value = z
        .object({ user: z.object({ email: z.string(), role: z.string() }) })
        .parse(JSON.parse(new TextDecoder().decode(session.bytes)) as unknown);
      check(
        value.user.email === account.email && value.user.role === role,
        'Synthetic session identity/role differs.',
      );
      const admin = await request(`${role} admin access`, '/admin', {
        headers: { Cookie: cookie },
      });
      check(
        role === 'ADMIN'
          ? admin.response.status === 200
          : [302, 303, 403].includes(admin.response.status),
        'Admin role enforcement differs.',
      );
    } finally {
      const logout = await request(`${role} logout`, '/api/auth/sign-out', {
        method: 'POST',
        headers: {
          Cookie: cookie,
          Origin: base.origin,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      check(logout.response.status === 200, 'Logout failed.');
    }
  }
  report.completed = true;
  console.log(
    'Protected preview HTTP smoke passed. Playwright and external delivery were not run.',
  );
} catch (error) {
  report.failure =
    error instanceof Error ? error.message : 'Preview smoke failed.';
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  await writePrivate(reportPath, report);
}
