import { z } from 'zod';
import { createTestSandbox } from './test-sandbox';

const reservation = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch: () => new Response('', { status: 503 }),
});
const port = reservation.port;
await reservation.stop(true);
const baseUrl = `http://127.0.0.1:${port}`;
const sandbox = await createTestSandbox(baseUrl);
let app: ReturnType<typeof Bun.spawn> | undefined;

function requireCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

async function readPng(response: Response, description: string) {
  requireCondition(
    response.status === 200 &&
      response.headers.get('content-type')?.includes('image/png') === true,
    `${description}: expected a PNG response (${response.status}).`,
  );
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer);
  requireCondition(
    bytes[0] === 137 &&
      bytes[1] === 80 &&
      view.getUint32(16) === 1200 &&
      view.getUint32(20) === 630,
    `${description}: invalid PNG dimensions.`,
  );
}

try {
  await sandbox.migrate();
  await sandbox.run(['run', 'db:sync']);
  app = Bun.spawn(
    [
      'node',
      'node_modules/vite/bin/vite.js',
      'dev',
      '--host',
      '127.0.0.1',
      '--strictPort',
      '--port',
      String(port),
    ],
    { env: sandbox.env, stdout: 'ignore', stderr: 'inherit' },
  );
  const deadline = Date.now() + 180_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (app.exitCode !== null)
      throw new Error('Disposable Worker exited before readiness.');
    try {
      const response = await fetch(`${baseUrl}/api/auth/get-session`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      /* Wait only while the known dev process is starting. */
    }
    await Bun.sleep(250);
  }
  requireCondition(ready, 'Timed out starting the disposable Worker.');
  const home = await fetch(`${baseUrl}/en`);
  requireCondition(
    home.status === 200 &&
      home.headers.get('cache-control')?.includes('private') === true,
    'Localized HTML/cache policy failed.',
  );
  for (const path of ['/robots.txt', '/sitemap.xml', '/esbuild.wasm']) {
    const response = await fetch(`${baseUrl}${path}`);
    requireCondition(
      response.status === 200,
      `Public asset/SEO response failed: ${path}`,
    );
    await response.body?.cancel();
  }
  await readPng(
    await fetch(`${baseUrl}/api/og?type=Home`),
    'Known legacy Home OG redirect',
  );
  await readPng(
    await fetch(
      `${baseUrl}/api/og?title=Workerd%20synthetic%20custom%20render&type=Challenge&difficulty=HARD&xp=0`,
      { redirect: 'manual' },
    ),
    'Dynamic workerd/WASM OG',
  );
  const registration = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { Origin: baseUrl, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'worker-smoke@example.invalid',
      password: 'Synthetic-worker-smoke-password-2026',
      name: 'Synthetic Worker smoke',
      role: 'ADMIN',
    }),
  });
  requireCondition(
    registration.ok,
    `Worker registration failed (${registration.status}).`,
  );
  const cookie = registration.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  requireCondition(
    cookie.includes('session_token='),
    'Worker session cookie is missing.',
  );
  const session = await fetch(`${baseUrl}/api/auth/get-session`, {
    headers: { Cookie: cookie },
  });
  const value: unknown = await session.json();
  z.object({
    user: z.object({
      email: z.literal('worker-smoke@example.invalid'),
      role: z.literal('USER'),
    }),
  }).parse(value);
  console.log(
    'Local Worker HTTP smoke passed: HTML/cache, robots/sitemap/WASM, static/dynamic OG, registration, session and role input denial. Playwright was not run.',
  );
} finally {
  if (app && app.exitCode === null) {
    app.kill();
    const stopped = await Promise.race([
      app.exited.then(() => true),
      Bun.sleep(5000).then(() => false),
    ]);
    if (!stopped) {
      app.kill(9);
      await app.exited;
    }
  }
  await sandbox.dispose();
}
