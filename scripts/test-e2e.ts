import { createTestSandbox } from './test-sandbox';
import { createServer } from 'node:net';

const projectRoot = process.cwd();
const bunExecutable = process.execPath;
type SeedUser = {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'ADMIN';
};

const adminUser: SeedUser = {
  email: 'e2e-admin@example.com',
  password: 'e2e-admin-password',
  name: 'E2E Admin User',
  role: 'ADMIN',
};

type Environment = Record<string, string | undefined>;
type Subprocess = ReturnType<typeof Bun.spawn>;

let appProcess: Subprocess | undefined;
let activeProcess: Subprocess | undefined;
let sandbox: Awaited<ReturnType<typeof createTestSandbox>> | undefined;

function buildEnvironment(overrides: Environment = {}): Environment {
  const inheritedEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

  return { ...inheritedEnvironment, ...overrides };
}

function spawnCommand(
  command: string,
  args: string[],
  options: {
    env?: Environment;
    stdout?: 'inherit' | 'pipe' | 'ignore';
    stderr?: 'inherit' | 'pipe' | 'ignore';
  } = {},
): Subprocess {
  return Bun.spawn([command, ...args], {
    cwd: projectRoot,
    env: buildEnvironment(options.env),
    stdout: options.stdout ?? 'inherit',
    stderr: options.stderr ?? 'inherit',
  });
}

async function runCommand(
  command: string,
  args: string[],
  env?: Environment,
): Promise<void> {
  const options: { env?: Environment } = {};
  if (env) options.env = env;
  const child = spawnCommand(command, args, options);
  activeProcess = child;
  const exitCode = await child.exited;
  if (activeProcess === child) activeProcess = undefined;

  if (exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${exitCode}: ${command} ${args.join(' ')}`,
    );
  }
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function waitFor(
  description: string,
  check: () => Promise<boolean>,
  timeoutMilliseconds = 120_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMilliseconds;

  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(250);
  }

  throw new Error(`Timed out waiting for ${description}.`);
}

async function findFreePort(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not determine an available local port.'));
        return;
      }

      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function resolvePort(
  environmentName: 'E2E_DB_PORT' | 'E2E_APP_PORT',
): Promise<number> {
  const configured =
    environmentName === 'E2E_DB_PORT'
      ? process.env.E2E_DB_PORT
      : process.env.E2E_APP_PORT;
  if (configured === undefined || configured === '' || configured === '0') {
    return findFreePort();
  }

  const port = Number(configured);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(
      `${environmentName} must be an integer between 1024 and 65535, or 0 for automatic selection. Received: ${configured}`,
    );
  }

  const availablePort = await findFreePort();
  if (availablePort === port) return port;

  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => {
      probe.close((error) => (error ? reject(error) : resolve()));
    });
  }).catch(() => {
    throw new Error(
      `${environmentName}=${port} is already in use. Choose another port or set ${environmentName}=0 for automatic selection.`,
    );
  });

  return port;
}

async function seedUser(
  baseUrl: string,
  secret: string,
  user: SeedUser,
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/test/seed-user`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-e2e-secret': secret,
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(
      `Could not seed ${user.email}: ${response.status} ${await response.text()}`,
    );
  }
}

async function seedProgress(
  baseUrl: string,
  secret: string,
  email: string,
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/test/set-progress`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-e2e-secret': secret,
    },
    body: JSON.stringify({
      email,
      type: 'challenge',
      slug: 'css-selector-101-id-class',
      xp: 50,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Could not seed admin progress: ${response.status} ${await response.text()}`,
    );
  }
}

async function verifyUserLogin(baseUrl: string, user: SeedUser): Promise<void> {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseUrl },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  if (!response.ok || !response.headers.getSetCookie().length) {
    throw new Error(`E2E authentication preflight failed (${response.status}).`);
  }
  await response.body?.cancel();
}

async function stopProcess(child: Subprocess | undefined): Promise<boolean> {
  if (!child) return true;

  try {
    child.kill();
  } catch {
    return true;
  }

  const stoppedGracefully = await Promise.race([
    child.exited.then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (stoppedGracefully) return true;

  try {
    child.kill(9);
  } catch {
    return true;
  }

  return Promise.race([
    child.exited.then(() => true),
    delay(5_000).then(() => false),
  ]);
}

async function cleanup(): Promise<boolean> {
  let succeeded = true;

  if (!(await stopProcess(activeProcess))) {
    console.error('Could not stop the active E2E subprocess.');
    succeeded = false;
  }
  if (!(await stopProcess(appProcess))) {
    console.error('Could not stop the E2E app process.');
    succeeded = false;
  }

  if (sandbox) await sandbox.dispose();

  return succeeded;
}

async function main(): Promise<void> {
  const appPort = await resolvePort('E2E_APP_PORT');
  const host = '127.0.0.1';
  const baseUrl = `http://${host}:${appPort}`;
  sandbox = await createTestSandbox(baseUrl);
  const e2eSecret = sandbox.e2eSecret;
  const testEnvironment: Environment = {
    ...buildEnvironment(sandbox.env),
    E2E_ADMIN_EMAIL: adminUser.email,
    E2E_ADMIN_PASSWORD: adminUser.password,
  };
  console.log('Applying schema and syncing deterministic test content...');
  await sandbox.migrate();
  await runCommand(bunExecutable, ['run', 'db:sync'], testEnvironment);

  console.log(`Starting test-mode app at ${baseUrl}...`);
  appProcess = spawnCommand(
    'node',
    [
      'node_modules/vite/bin/vite.js',
      'dev',
      '--host',
      host,
      '--strictPort',
      '--port',
      String(appPort),
    ],
    { env: testEnvironment },
  );

  await waitFor('test-mode app readiness', async () => {
    try {
      const response = await fetch(`${baseUrl}/en/login`);
      return response.status < 500;
    } catch {
      return false;
    }
  });

  await seedUser(baseUrl, e2eSecret, adminUser);
  await seedProgress(baseUrl, e2eSecret, adminUser.email);
  await verifyUserLogin(baseUrl, adminUser);
  const preflightUser: SeedUser = {
    email: `e2e-preflight-${crypto.randomUUID()}@example.com`,
    password: `e2e-preflight-${crypto.randomUUID()}`,
    name: 'E2E authentication preflight',
  };
  await seedUser(baseUrl, e2eSecret, preflightUser);
  await verifyUserLogin(baseUrl, preflightUser);

  const forwardedArguments = process.argv
    .slice(2)
    .filter((argument) => argument !== '--');
  console.log('Running Playwright with disposable test data...');
  await runCommand(
    bunExecutable,
    ['x', 'playwright', 'test', ...forwardedArguments],
    {
      ...testEnvironment,
      BASE_URL: baseUrl,
      E2E_EXTERNAL_SERVER: '1',
    },
  );
}

function handleSignal(): void {
  activeProcess?.kill();
  appProcess?.kill();
}

process.once('SIGINT', handleSignal);
process.once('SIGTERM', handleSignal);

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', handleSignal);
  process.removeListener('SIGTERM', handleSignal);
  const cleanupSucceeded = await cleanup();
  if (!cleanupSucceeded) process.exitCode = 1;
}
