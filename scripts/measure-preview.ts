/* eslint-disable security/detect-non-literal-fs-filename -- Explicit private evidence paths only. */
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { assertPrivatePath, writePrivate } from './migration/model';
import { readJsonConfig } from './json-config';

const [secretsPath, accountsPath, reportPath] = process.argv.slice(2);
if (!secretsPath || !accountsPath || !reportPath)
  throw new Error(
    'Specify private preview-access, synthetic-account and new-report paths.',
  );
for (const path of [secretsPath, accountsPath, reportPath])
  assertPrivatePath(path);

async function main() {
  const access = z
    .object({ PREVIEW_ACCESS_TOKEN: z.string().min(32) })
    .parse(JSON.parse(await readFile(secretsPath!, 'utf8')) as unknown);
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
    .parse(JSON.parse(await readFile(accountsPath!, 'utf8')) as unknown);
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
    throw new Error('Evidence credentials do not match isolated preview.');
  const run = crypto.randomUUID();
  const report = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    completed: false,
    run,
    target: base.origin,
    concurrencyCap: 8,
    requestCap: 100,
    externalDelivery: false,
    failure: '',
    requests: [] as {
      label: string;
      status: number;
      wallMs: number;
      bytes: number;
    }[],
  };
  let requested = 0;
  const check = (condition: unknown, label: string): void => {
    if (!condition) throw new Error(label);
  };
  const request = async (
    label: string,
    path: string,
    options: RequestInit = {},
    authorized = true,
  ) => {
    if (++requested > report.requestCap)
      throw new Error('Bounded preview request cap reached.');
    const url = new URL(path, base);
    check(url.origin === base.origin, 'Cross-origin preview request rejected.');
    const headers = new Headers(options.headers);
    headers.set('User-Agent', `TWE-preview-readiness/${run}`);
    if (authorized)
      headers.set(
        'Authorization',
        `Basic ${btoa(`preview:${access.PREVIEW_ACCESS_TOKEN}`)}`,
      );
    const started = performance.now();
    const response = await fetch(url, {
      ...options,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(45_000),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    report.requests.push({
      label,
      status: response.status,
      wallMs: Math.round(performance.now() - started),
      bytes: bytes.length,
    });
    check(
      response.headers.get('x-robots-tag') === 'noindex, nofollow' &&
        response.headers.get('cache-control')?.includes('private'),
      'Preview isolation headers failed.',
    );
    check(
      response.headers.get('x-content-type-options') === 'nosniff' &&
        response.headers.get('x-frame-options') === 'SAMEORIGIN',
      'Security headers failed.',
    );
    return { response, bytes };
  };
  const titles = [
    'Unicode café naïve — Привет',
    'مرحبا بالعالم',
    '日本語の練習',
    'Emoji 🧪 👩🏽‍💻',
    'Long title '.repeat(15),
    'Selectors & quotes <tag> "value"',
  ];
  const image = async (index: number) => {
    const title = `${titles[index % titles.length]} ${run.slice(0, 8)} ${index}`;
    const { response, bytes } = await request(
      `unique OG ${index}`,
      `/api/og?${new URLSearchParams({ type: 'Challenge', title, xp: '0' })}`,
    );
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    check(
      response.status === 200 &&
        bytes.length >= 24 &&
        view.getUint32(0) === 0x89504e47 &&
        view.getUint32(16) === 1200 &&
        view.getUint32(20) === 630,
      'OG status/header/dimensions failed.',
    );
    if (index < titles.length)
      await writeFile(
        join(dirname(reportPath!), `og-${run}-${index}.png`),
        bytes,
        { mode: 0o600, flag: 'wx' },
      );
  };
  const authenticate = async (role: 'USER' | 'ADMIN') => {
    const account = accounts.credentials.find((item) => item.role === role);
    if (!account) throw new Error('Synthetic role account is missing.');
    const login = await request(`${role} login`, '/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base.origin },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    });
    check(login.response.status === 200, 'Synthetic login failed.');
    const cookieHeaders = login.response.headers.getSetCookie();
    check(
      cookieHeaders.some(
        (cookie) =>
          /session_token=/.test(cookie) &&
          /;\s*HttpOnly/i.test(cookie) &&
          /;\s*Secure/i.test(cookie) &&
          /;\s*SameSite=Lax/i.test(cookie),
      ),
      'Session cookie isolation failed.',
    );
    const cookie = cookieHeaders.map((value) => value.split(';')[0]).join('; ');
    try {
      const session = await request(
        `${role} session`,
        '/api/auth/get-session',
        { headers: { Cookie: cookie } },
      );
      const identity = z
        .object({ user: z.object({ email: z.string(), role: z.string() }) })
        .parse(JSON.parse(new TextDecoder().decode(session.bytes)) as unknown);
      check(
        session.response.status === 200 &&
          identity.user.email === account.email &&
          identity.user.role === role,
        'Concurrent session identity differs.',
      );
      for (const path of ['/admin', '/en/profile']) {
        const result = await request(`${role} ${path}`, path, {
          headers: { Cookie: cookie },
        });
        check(
          path === '/en/profile' || role === 'ADMIN'
            ? result.response.status === 200
            : [302, 303, 307, 308, 403].includes(result.response.status),
          'Authenticated role route differed.',
        );
      }
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
      check(logout.response.status === 200, 'Synthetic logout failed.');
    }
  };
  await mkdir(dirname(reportPath!), { recursive: true, mode: 0o700 });
  await chmod(dirname(reportPath!), 0o700);
  try {
    // The first measured request is not called cold unless the live tail proves a new boot.
    const first = await request('first measured SSR', '/en');
    check(first.response.status === 200, 'Initial SSR failed.');
    for (const path of ['/en', '/esbuild.wasm'])
      check(
        (await request('unauthorized gate', path, {}, false)).response
          .status === 401,
        'Preview access gate bypassed.',
      );
    for (const path of [
      '/en',
      '/id',
      '/en/about',
      '/id/about',
      '/en/learn',
      '/en/practice',
      '/en/leaderboard',
      '/en/labs',
      '/en/contact',
      '/en/privacy',
      '/en/terms',
      '/en/login',
      '/en/register',
      '/en/forgot-password',
      '/docs',
      '/docs/api',
      '/robots.txt',
      '/sitemap.xml',
      '/esbuild.wasm',
    ]) {
      check(
        (await request(`route ${path}`, path)).response.status === 200,
        'Public route failed.',
      );
    }
    for (const path of ['/admin', '/en/profile'])
      check(
        [302, 303, 307, 308, 403].includes(
          (await request('anonymous protected route', path)).response.status,
        ),
        'Anonymous protected route exposed.',
      );
    for (const path of [
      '/api/test/seed-user',
      '/api/test/reset-progress',
      '/api/test/set-progress',
      '/api/test/teardown-user',
    ]) {
      const denied = await request('test API denied', path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: base.origin },
        body: '{}',
      });
      check(
        [403, 404].includes(denied.response.status),
        'Test-only API was enabled.',
      );
    }
    // Exceed the 16-entry image cache to observe bounded eviction/memory behavior.
    for (let index = 0; index < 24; index++) await image(index);
    for (let round = 0; round < 2; round++) {
      if (round) await Bun.sleep(11_000); // Respect the existing shared-IP auth rate window.
      const outcomes = await Promise.allSettled([
        authenticate('USER'),
        authenticate('ADMIN'),
        image(24 + round * 4),
        image(25 + round * 4),
        image(26 + round * 4),
        image(27 + round * 4),
        request('mixed Learn SSR', '/en/learn'),
        request('mixed Practice SSR', '/en/practice'),
      ]);
      if (outcomes.some((outcome) => outcome.status === 'rejected'))
        throw new Error('A bounded concurrent preview request failed.');
    }
    report.completed = true;
  } catch (error) {
    report.failure =
      error instanceof Error ? error.message : 'Bounded preview check failed.';
    process.exitCode = 1;
  } finally {
    report.completedAt = new Date().toISOString();
    await writePrivate(reportPath!, report);
  }
  console.log(
    JSON.stringify({
      completed: report.completed,
      requests: report.requests.length,
      concurrencyCap: report.concurrencyCap,
      externalDelivery: false,
      failure: report.failure,
    }),
  );
}
try {
  await main();
} catch {
  console.error(
    'Preview measurement failed; inspect private target/access/report paths. No credentials or user payloads are logged.',
  );
  process.exitCode = 1;
}
