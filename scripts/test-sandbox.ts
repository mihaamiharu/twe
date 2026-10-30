/* eslint-disable security/detect-non-literal-fs-filename -- All paths are fixed project inputs or this runner's uniquely created sandbox. */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function createTestSandbox(baseUrl: string) {
  const root = resolve(import.meta.dirname, '..');
  const parent = join(root, '.wrangler', 'test-runs');
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(join(parent, 'run-'));
  const configPath = join(directory, 'wrangler.json');
  const statePath = join(directory, 'state');
  const e2eSecret = crypto.randomUUID();
  const config = {
    name: 'twe-disposable-test',
    main: join(root, 'src/server.ts'),
    compatibility_date: '2026-10-29',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: false,
    preview_urls: false,
    durable_objects: {
      bindings: [{ name: 'APP_RUNTIME', class_name: 'AppRuntime' }],
    },
    migrations: [{ tag: 'app-runtime-v1', new_sqlite_classes: ['AppRuntime'] }],
    assets: { binding: 'ASSETS', directory: join(root, 'public') },
    vars: {
      APP_ENV: 'test',
      BETTER_AUTH_URL: baseUrl,
      BETTER_AUTH_SECRET: `test-${crypto.randomUUID()}-${crypto.randomUUID()}`,
      E2E_SECRET: e2eSecret,
      REQUIRE_EMAIL_VERIFICATION: 'false',
      EMAIL_PROVIDER: 'disabled',
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: 'twe-disposable-test',
        database_id: 'local-only',
        migrations_dir: join(root, 'drizzle/d1'),
      },
    ],
  };
  await writeFile(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  await writeFile(join(directory, '.dev.vars'), '', { mode: 0o600 });
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    CLOUDFLARE_ENV: '',
    TWE_WRANGLER_CONFIG: configPath,
    TWE_D1_PERSIST: statePath,
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
  };
  async function run(args: string[]) {
    const child = Bun.spawn([process.execPath, ...args], {
      cwd: root,
      env,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const code = await child.exited;
    if (code !== 0) throw new Error(`Test setup command failed (${code}).`);
  }
  return {
    env,
    e2eSecret,
    directory,
    configPath,
    statePath,
    run,
    migrate: () =>
      run([
        'x',
        'wrangler',
        'd1',
        'migrations',
        'apply',
        'DB',
        '--local',
        '--config',
        configPath,
        '--persist-to',
        statePath,
      ]),
    dispose: () => rm(directory, { recursive: true, force: true }),
  };
}
