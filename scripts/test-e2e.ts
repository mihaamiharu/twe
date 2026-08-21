import { createServer } from 'node:net';

const projectRoot = process.cwd();
const bunExecutable = process.execPath;
const containerName = `twe-e2e-${process.pid}-${Date.now()}`;
const databaseName = 'twe_e2e';
const databaseUser = 'twe_e2e';
const databasePassword = 'twe_e2e_password';
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

type Environment = Record<string, string>;
type ContainerRuntime = 'docker' | 'podman';
type Subprocess = ReturnType<typeof Bun.spawn>;
type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

let appProcess: Subprocess | undefined;
let activeProcess: Subprocess | undefined;
let containerCreated = false;
let containerRuntime: ContainerRuntime = 'podman';

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

async function captureCommand(
  command: string,
  args: string[],
  env?: Environment,
): Promise<CommandResult> {
  const options: {
    env?: Environment;
    stdout: 'pipe';
    stderr: 'pipe';
  } = { stdout: 'pipe', stderr: 'pipe' };
  if (env) options.env = env;
  const child = spawnCommand(command, args, options);
  activeProcess = child;

  const stdoutStream = child.stdout;
  const stderrStream = child.stderr;
  if (typeof stdoutStream === 'number' || typeof stderrStream === 'number') {
    throw new Error(`Could not capture output from ${command}.`);
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(stdoutStream).text(),
    new Response(stderrStream).text(),
    child.exited,
  ]);

  if (activeProcess === child) activeProcess = undefined;
  return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
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

function resolveContainerRuntime(): ContainerRuntime {
  const configuredRuntime = process.env.E2E_CONTAINER_RUNTIME;
  if (configuredRuntime === undefined || configuredRuntime === '') {
    return 'podman';
  }
  if (configuredRuntime === 'docker' || configuredRuntime === 'podman') {
    return configuredRuntime;
  }

  throw new Error(
    `E2E_CONTAINER_RUNTIME must be "podman" or "docker". Received: ${configuredRuntime}`,
  );
}

async function ensureContainerRuntime(
  runtime: ContainerRuntime,
): Promise<void> {
  const displayName = runtime === 'docker' ? 'Docker' : 'Podman';
  let version: CommandResult;
  try {
    version = await captureCommand(runtime, ['--version']);
  } catch {
    throw new Error(
      `${displayName} is required for E2E tests but was not found on PATH. Install ${displayName} and retry.`,
    );
  }
  if (version.exitCode !== 0) {
    throw new Error(
      `${displayName} is required for E2E tests. Install ${displayName} and ensure the ${runtime} command is on PATH.`,
    );
  }

  const info = await captureCommand(runtime, ['info']);
  if (info.exitCode === 0) return;

  const serviceHint =
    runtime === 'podman'
      ? 'Start your intended Podman machine or service. The E2E runner will not start a machine automatically because that could activate unrelated workloads.'
      : 'Start the Docker daemon or Docker Desktop.';
  throw new Error(
    `${displayName} is installed but its service is unavailable. ${serviceHint}\n${info.stderr}`,
  );
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

  if (containerCreated) {
    const result = await captureCommand(containerRuntime, [
      'rm',
      '-f',
      containerName,
    ]);
    if (result.exitCode !== 0) {
      console.error(
        `Could not remove disposable E2E container ${containerName}. Remove only that container manually with: ${containerRuntime} rm -f ${containerName}\n${result.stderr}`,
      );
      succeeded = false;
    }
  }

  return succeeded;
}

async function main(): Promise<void> {
  containerRuntime = resolveContainerRuntime();
  await ensureContainerRuntime(containerRuntime);

  const databasePort = await resolvePort('E2E_DB_PORT');
  const appPort = await resolvePort('E2E_APP_PORT');
  if (databasePort === appPort) {
    throw new Error(
      `E2E_DB_PORT and E2E_APP_PORT both resolved to ${databasePort}. Configure distinct ports, or set either value to 0 for automatic selection.`,
    );
  }
  const e2eSecret = `e2e-${crypto.randomUUID()}`;
  const authSecret = `e2e-auth-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const host = '127.0.0.1';
  const databaseUrl = `postgresql://${databaseUser}:${databasePassword}@${host}:${databasePort}/${databaseName}`;
  const baseUrl = `http://${host}:${appPort}`;
  const databasePortMapping = `127.0.0.1:${databasePort}:5432`;
  const testEnvironment: Environment = {
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    BETTER_AUTH_SECRET: authSecret,
    BETTER_AUTH_URL: baseUrl,
    VITE_APP_URL: baseUrl,
    E2E_SECRET: e2eSecret,
    REQUIRE_EMAIL_VERIFICATION: 'false',
    E2E_ADMIN_EMAIL: adminUser.email,
    E2E_ADMIN_PASSWORD: adminUser.password,
  };

  console.log(
    `Starting disposable PostgreSQL 15 container with ${containerRuntime} on ${host}:${databasePort}...`,
  );
  await runCommand(containerRuntime, [
    'run',
    '--detach',
    '--name',
    containerName,
    '--label',
    'com.twe.e2e=disposable',
    '--publish',
    databasePortMapping,
    '--env',
    `POSTGRES_DB=${databaseName}`,
    '--env',
    `POSTGRES_USER=${databaseUser}`,
    '--env',
    `POSTGRES_PASSWORD=${databasePassword}`,
    'postgres:15-alpine',
  ]);
  containerCreated = true;

  await waitFor('PostgreSQL readiness', async () => {
    const result = await captureCommand(containerRuntime, [
      'exec',
      containerName,
      'pg_isready',
      '-U',
      databaseUser,
      '-d',
      databaseName,
    ]);
    return result.exitCode === 0;
  });

  console.log('Applying schema and syncing deterministic test content...');
  await runCommand(bunExecutable, ['run', 'db:migrate'], testEnvironment);
  await runCommand(bunExecutable, ['run', 'db:sync'], testEnvironment);

  console.log(`Starting test-mode app at ${baseUrl}...`);
  appProcess = spawnCommand(
    bunExecutable,
    ['--bun', 'vite', 'dev', '--host', host, '--port', String(appPort)],
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
