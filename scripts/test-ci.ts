const testDatabaseUrl =
  'postgresql://twe_test:twe_password@localhost:5433/twe_test';

async function run(
  command: string[],
  env: Record<string, string | undefined> = process.env,
): Promise<number> {
  const process = Bun.spawn(command, {
    cwd: import.meta.dir.replace(/[\\/]scripts$/, ''),
    env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return process.exited;
}

type ContainerRuntime = 'docker' | 'podman';

const configuredRuntime = process.env.E2E_CONTAINER_RUNTIME;
const runtimeIsSupported =
  configuredRuntime === undefined ||
  configuredRuntime === '' ||
  configuredRuntime === 'docker' ||
  configuredRuntime === 'podman';
if (!runtimeIsSupported) {
  throw new Error(
    `E2E_CONTAINER_RUNTIME must be "podman" or "docker". Received: ${configuredRuntime}`,
  );
}

const explicitRuntime =
  configuredRuntime === 'docker' || configuredRuntime === 'podman'
    ? configuredRuntime
    : undefined;
const detectedRuntime: ContainerRuntime | undefined = Bun.which('docker')
  ? 'docker'
  : Bun.which('podman')
    ? 'podman'
    : undefined;
const containerRuntime = explicitRuntime ?? detectedRuntime;

if (containerRuntime === undefined) {
  throw new Error(
    'Neither Docker nor Podman was found on PATH. Install Docker Desktop (or Podman), start it, and retry.',
  );
}

let exitCode = await run([
  containerRuntime,
  'compose',
  'up',
  '-d',
  '--wait',
  'postgres_test',
]);

if (exitCode === 0) {
  try {
    const testEnv = {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      NODE_ENV: 'test',
    };

    exitCode = await run(['bun', 'run', 'db:migrate'], testEnv);
    if (exitCode === 0) exitCode = await run(['bun', 'run', 'test:unit']);
    if (exitCode === 0) {
      exitCode = await run(['bun', 'run', 'test:integration'], testEnv);
    }
  } finally {
    const cleanupExitCode = await run([
      containerRuntime,
      'compose',
      'stop',
      'postgres_test',
    ]);
    if (exitCode === 0) exitCode = cleanupExitCode;
  }
}

process.exit(exitCode);
