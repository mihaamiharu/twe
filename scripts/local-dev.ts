import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

export const localDatabaseUrl =
  'postgresql://twe_user:twe_password@localhost:5432/twe_db';

export function localEnvironment(values: Record<string, string | undefined>) {
  // These helpers manage the Compose database, never a separately configured DB.
  if (values['DATABASE_URL'] && values['DATABASE_URL'] !== localDatabaseUrl) {
    throw new Error(
      'Local helpers require the DATABASE_URL from .env.example. Use bun run dev for a custom database.',
    );
  }
  if (values['DIRECT_URL']) {
    throw new Error('Unset DIRECT_URL before using local helpers.');
  }
  return {
    ...values,
    DATABASE_URL: localDatabaseUrl,
    DIRECT_URL: '',
    TEST_DATABASE_URL: '',
    NODE_ENV: 'development',
    BETTER_AUTH_URL: 'http://localhost:3000',
  };
}

export function createLocalEnv(template: string) {
  return template.replace(
    /^BETTER_AUTH_SECRET=.*$/m,
    `BETTER_AUTH_SECRET="${randomBytes(32).toString('hex')}"`,
  );
}

export function ensureLocalEnv(envPath: string, templatePath: string) {
  // Callers supply repository paths or isolated test fixtures, never user input.
  /* eslint-disable security/detect-non-literal-fs-filename */
  if (existsSync(envPath)) return false;
  // Exclusive creation preserves configuration even in concurrent runs.
  writeFileSync(envPath, createLocalEnv(readFileSync(templatePath, 'utf8')), {
    flag: 'wx',
  });
  /* eslint-enable security/detect-non-literal-fs-filename */
  return true;
}

export function localCommands(action: string, runtime: 'docker' | 'podman') {
  const compose = [runtime, 'compose', '-f', 'docker-compose.yml'];
  const up = [...compose, 'up', '-d', '--wait', 'postgres'];
  switch (action) {
    case 'setup':
      return [up, ['bun', 'run', 'db:migrate'], ['bun', 'run', 'db:sync']];
    case 'dev':
      return [up, ['bun', 'run', 'dev']];
    case 'up':
      return [up];
    case 'stop':
      return [[...compose, 'stop', 'postgres']];
    default:
      throw new Error('Usage: bun scripts/local-dev.ts setup|dev|up|stop');
  }
}

async function main() {
  const action = process.argv[2] ?? '';
  const configuredRuntime = process.env['LOCAL_CONTAINER_RUNTIME'] || 'docker';
  if (configuredRuntime !== 'docker' && configuredRuntime !== 'podman') {
    throw new Error('LOCAL_CONTAINER_RUNTIME must be docker or podman.');
  }
  const commands = localCommands(action, configuredRuntime);
  const projectRoot = resolve(import.meta.dir, '..');
  if (!Bun.which(configuredRuntime)) {
    throw new Error(
      `Install and start ${configuredRuntime === 'docker' ? 'Docker Desktop' : 'Podman'} before running this command.`,
    );
  }

  const envPath = resolve(projectRoot, '.env');
  // envPath is the fixed .env file beneath this script's repository root.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(envPath)) {
    if (action !== 'setup')
      throw new Error('Run bun run setup first to create .env.');
    ensureLocalEnv(envPath, resolve(projectRoot, '.env.example'));
    console.log('Created .env with a generated auth secret.');
  }
  const env = localEnvironment({
    ...process.env,
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed repository .env path.
    ...parse(readFileSync(envPath)),
  });
  for (const command of commands) {
    if (command[0] === 'bun') command[0] = process.execPath;
    const child = Bun.spawn(command, {
      cwd: projectRoot,
      env,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const exitCode = await child.exited;
    if (exitCode !== 0) {
      throw new Error(
        `Command failed (${exitCode}): ${command.join(' ')}. Ensure the container engine is running and port 5432 is available.`,
      );
    }
  }
  if (action === 'setup') console.log('Setup complete. Run bun run dev:local.');
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : 'Local development failed.',
    );
    process.exitCode = 1;
  });
}
