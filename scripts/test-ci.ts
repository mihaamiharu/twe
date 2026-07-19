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

let exitCode = await run([
  'podman',
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
      'podman',
      'compose',
      'stop',
      'postgres_test',
    ]);
    if (exitCode === 0) exitCode = cleanupExitCode;
  }
}

process.exit(exitCode);
