/* eslint-disable security/detect-non-literal-fs-filename -- Paths are explicit restricted recovery artifacts or this run's private directory. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { createTestSandbox } from '../test-sandbox';
import { assertPrivatePath, snapshotSchema, writePrivate } from './model';

const [dumpPath, outputPath, sourceCommit] = process.argv.slice(2);
if (
  !dumpPath ||
  !outputPath ||
  !sourceCommit ||
  !/^[a-f0-9]{40}$/.test(sourceCommit)
)
  throw new Error(
    'Usage: bun scripts/migration/rehearse-backup.ts /private/source.dump /private/new-rehearsal-directory <deployed-commit-sha>',
  );
assertPrivatePath(dumpPath);
const output = assertPrivatePath(outputPath);
await mkdir(output, { mode: 0o700 }); // Exclusive fresh run directory; never overwrite evidence.
const root = resolve(import.meta.dirname, '../..');
const runtime = z
  .enum(['podman', 'docker'])
  .parse(process.env['TWE_REHEARSAL_RUNTIME'] ?? 'podman');
const container = `twe-pg-rehearsal-${crypto.randomUUID()}`;
const password = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
const image = 'postgres:15.17-alpine';
const startedAt = Date.now();
const sandbox = await createTestSandbox('http://localhost:3000');
const state = join(output, 'd1-state');
sandbox.env['TWE_D1_PERSIST'] = state;
const env = { ...sandbox.env, POSTGRES_PASSWORD: password };
let created = false;
let aborted = false;
let active: ReturnType<typeof Bun.spawn> | undefined;
const abort = () => {
  aborted = true;
  active?.kill();
};
process.once('SIGINT', abort);
process.once('SIGTERM', abort);

async function capture(
  command: string[],
  options: {
    stdin?: ReturnType<typeof Bun.file>;
    env?: Record<string, string | undefined>;
    allowFailure?: boolean;
  } = {},
) {
  if (aborted) throw new Error('Rehearsal interrupted.');
  const child = Bun.spawn(command, {
    cwd: root,
    env: options.env ?? env,
    stdin: options.stdin ?? 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  active = child;
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (active === child) active = undefined;
  if (code !== 0 && !options.allowFailure) {
    await writeFile(join(output, 'failure.log'), stderr, { mode: 0o600 });
    throw new Error(
      `${command[0]} failed (${code}); restricted diagnostics were saved privately.`,
    );
  }
  return { stdout, code };
}

const report = {
  completed: false,
  sourceCommit,
  dumpSha256: '',
  sourceCounts: {} as Record<string, number>,
  postgresVersion: '',
  importVerified: false,
  rollbackVerified: false,
  elapsedMs: 0,
  failure: '',
};
try {
  await capture([runtime, 'info']);
  report.dumpSha256 = createHash('sha256')
    .update(await readFile(dumpPath))
    .digest('hex');
  await capture([
    runtime,
    'run',
    '--detach',
    '--rm',
    '--name',
    container,
    '--label',
    'com.twe.migration-rehearsal=true',
    '--cpus',
    '1',
    '--memory',
    '512m',
    '--tmpfs',
    '/var/lib/postgresql/data:rw,size=256m',
    '--publish',
    '127.0.0.1::5432',
    '--env',
    'POSTGRES_PASSWORD',
    '--env',
    'POSTGRES_DB=twe_rehearsal',
    image,
  ]);
  created = true;
  const deadline = Date.now() + 60_000;
  let ready = false;
  while (Date.now() < deadline) {
    if (
      (
        await capture(
          [
            runtime,
            'exec',
            container,
            'pg_isready',
            '-U',
            'postgres',
            '-d',
            'twe_rehearsal',
          ],
          { allowFailure: true },
        )
      ).code === 0
    ) {
      ready = true;
      break;
    }
    await Bun.sleep(250);
  }
  if (!ready) throw new Error('Isolated PostgreSQL did not become ready.');
  console.log(
    'Restoring the restricted backup into an isolated, memory-backed PostgreSQL container.',
  );
  await capture(
    [
      runtime,
      'exec',
      '-i',
      container,
      'pg_restore',
      '--username',
      'postgres',
      '--dbname',
      'twe_rehearsal',
      '--no-owner',
      '--no-privileges',
      '--exit-on-error',
    ],
    { stdin: Bun.file(dumpPath) },
  );
  report.postgresVersion = (
    await capture([
      runtime,
      'exec',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      'twe_rehearsal',
      '-Atqc',
      'SHOW server_version',
    ])
  ).stdout.trim();
  const address = (
    await capture([runtime, 'port', container, '5432/tcp'])
  ).stdout.trim();
  const port = /^127\.0\.0\.1:(\d+)$/.exec(address)?.[1];
  if (!port)
    throw new Error(
      'Rehearsal PostgreSQL is not bound exclusively to loopback.',
    );
  const snapshotPath = join(output, 'normalized-snapshot.json');
  await capture(
    [
      process.execPath,
      'scripts/migration/export-postgres.ts',
      snapshotPath,
      sourceCommit,
    ],
    {
      env: {
        ...env,
        TWE_SOURCE_DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/twe_rehearsal`,
      },
    },
  );
  const snapshot = snapshotSchema.parse(
    JSON.parse(await readFile(snapshotPath, 'utf8')) as unknown,
  );
  report.sourceCounts = Object.fromEntries(
    Object.entries(snapshot.tables).map(([name, table]) => [name, table.count]),
  );
  await capture([
    process.execPath,
    'x',
    'wrangler',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--config',
    sandbox.configPath,
    '--persist-to',
    state,
  ]);
  const importPath = join(output, 'd1-import-report.json');
  await capture([
    process.execPath,
    'scripts/migration/import-d1.ts',
    'import',
    snapshotPath,
    importPath,
    'local',
  ]);
  const imported: unknown = JSON.parse(await readFile(importPath, 'utf8'));
  report.importVerified = z
    .object({ completed: z.literal(true) })
    .safeParse(imported).success;
  await capture([process.execPath, 'scripts/migration/rehearsal-writes.ts'], {
    env: { ...env, TWE_REHEARSAL_SYNTHETIC_WRITES: 'yes' },
  });
  const candidate = (await capture(['git', 'rev-parse', 'HEAD'])).stdout.trim();
  const d1Snapshot = join(output, 'post-cutover-d1.json');
  await capture([
    process.execPath,
    'scripts/migration/export-d1.ts',
    d1Snapshot,
    candidate,
    'local',
  ]);
  await capture([
    runtime,
    'exec',
    container,
    'createdb',
    '-U',
    'postgres',
    'twe_rollback',
  ]);
  const rollbackReport = join(output, 'postgres-rollback-report.json');
  await capture(
    [
      process.execPath,
      'scripts/migration/restore-postgres.ts',
      d1Snapshot,
      rollbackReport,
      '--apply-migrations',
    ],
    {
      env: {
        ...env,
        TWE_ROLLBACK_DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/twe_rollback`,
      },
    },
  );
  const reversed: unknown = JSON.parse(await readFile(rollbackReport, 'utf8'));
  report.rollbackVerified = z
    .object({ completed: z.literal(true) })
    .safeParse(reversed).success;
  report.completed = report.importVerified && report.rollbackVerified;
  console.log(
    JSON.stringify({
      event: 'restricted_backup_rehearsal_completed',
      completed: report.completed,
      counts: report.sourceCounts,
    }),
  );
} catch (error) {
  report.failure = error instanceof Error ? error.message : 'Rehearsal failed.';
  process.exitCode = 1;
  console.error(
    'Backup rehearsal failed; inspect only its restricted report/diagnostics.',
  );
} finally {
  if (created) {
    const cleanup = Bun.spawn([runtime, 'rm', '--force', container], {
      stdout: 'ignore',
      stderr: 'ignore',
    });
    if ((await cleanup.exited) !== 0) {
      report.failure += ` Container cleanup failed: remove only ${container}.`;
      report.completed = false;
      process.exitCode = 1;
    }
  }
  await sandbox.dispose();
  report.elapsedMs = Date.now() - startedAt;
  await writePrivate(join(output, 'rehearsal-report.json'), report);
  process.removeListener('SIGINT', abort);
  process.removeListener('SIGTERM', abort);
}
