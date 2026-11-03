/* eslint-disable security/detect-non-literal-fs-filename -- Credentials and SQL use restricted operator paths or this run's sandbox. */
/* eslint-disable security/detect-object-injection -- Table names come from the fixed migration map. */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { getDataPlatformProxy } from './data-platform-proxy';
import { z } from 'zod';
import { createTestSandbox } from './test-sandbox';
import { readJsonConfig } from './json-config';
import {
  assertPrivatePath,
  hashRows,
  rowSchema,
  tables,
  writePrivate,
  type Row,
} from './migration/model';
import type { RuntimeEnv } from '../src/runtime/env';

const output = process.argv[2];
if (!output)
  throw new Error(
    'Usage: bun scripts/seed-preview.ts /absolute/private/new-credentials.json',
  );
assertPrivatePath(output);
const config = z
  .object({
    env: z.object({
      preview: z.object({
        name: z.literal('twe-preview'),
        d1_databases: z.array(
          z.object({
            binding: z.string(),
            database_name: z.string(),
            database_id: z.string().uuid(),
          }),
        ),
      }),
    }),
  })
  .parse(await readJsonConfig('wrangler.jsonc'));
const binding = config.env.preview.d1_databases.find(
  (item) => item.binding === 'DB',
);
if (binding?.database_name !== 'twe-preview')
  throw new Error('Unexpected preview database binding.');

async function remote(sql: string) {
  const child = Bun.spawn(
    [
      process.execPath,
      'x',
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--remote',
      '--config',
      'wrangler.jsonc',
      '--env',
      'preview',
      '--command',
      sql,
      '--json',
    ],
    { stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' },
  );
  const [out, , code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0)
    throw new Error(
      'Preview query failed; no row data is included in diagnostics.',
    );
  return z
    .array(z.object({ success: z.literal(true), results: rowSchema.array() }))
    .parse(JSON.parse(out) as unknown);
}
const names = Object.keys(tables);
const guards = [...names, 'reward_operations', 'rate_limit_buckets'];
const counts = await remote(
  guards.map((name) => `SELECT count(*) AS total FROM "${name}"`).join(';'),
);
if (
  counts.length !== guards.length ||
  counts.some((item) => item.results[0]?.['total'] !== 0)
)
  throw new Error(
    'Preview is not empty. This command never overwrites existing data.',
  );

const sandbox = await createTestSandbox('http://localhost:3000');
let platform:
  | Awaited<ReturnType<typeof getDataPlatformProxy<RuntimeEnv>>>
  | undefined;
try {
  await sandbox.migrate();
  await sandbox.run(['run', 'db:sync']);
  platform = await getDataPlatformProxy<RuntimeEnv>({
    configPath: sandbox.configPath,
    remoteBindings: false,
    envFiles: [],
    persist: { path: join(sandbox.statePath, 'v3') },
  });
  const credentials: { role: string; email: string; password: string }[] = [];
  for (const role of ['USER', 'ADMIN']) {
    const id = crypto.randomUUID();
    const email = `preview-${role.toLowerCase()}-${id}@example.invalid`;
    const password = randomBytes(24).toString('base64url');
    const hash = await hashPassword(password);
    const now = Date.now();
    await platform.env.DB.batch([
      platform.env.DB.prepare(
        "INSERT INTO users (id,email,email_verified,name,role,profile_visibility,show_on_leaderboard,created_at,updated_at) VALUES (?,?,1,?,?,'PRIVATE',0,?,?)",
      ).bind(
        id,
        email,
        `Synthetic preview ${role.toLowerCase()}`,
        role,
        now,
        now,
      ),
      platform.env.DB.prepare(
        "INSERT INTO accounts (id,user_id,account_id,provider_id,password,created_at,updated_at) VALUES (?,?,?,'credential',?,?,?)",
      ).bind(crypto.randomUUID(), id, id, hash, now, now),
    ]);
    credentials.push({ role, email, password });
  }
  const source: Record<string, Row[]> = {};
  const statements: string[] = [];
  function literal(value: Row[string]) {
    if (value === null) return 'NULL';
    if (typeof value === 'number' && Number.isFinite(value))
      return String(value);
    if (typeof value !== 'string' || value.includes('\0'))
      throw new Error('Unsupported synthetic SQL value.');
    return `'${value.replaceAll("'", "''")}'`;
  }
  for (const name of names) {
    const rows = rowSchema
      .array()
      .parse(
        (
          await platform.env.DB.prepare(
            `SELECT * FROM "${name}" ORDER BY id`,
          ).all()
        ).results,
      );
    source[name] = rows;
    for (const row of rows) {
      const columns = Object.keys(row);
      statements.push(
        `INSERT INTO "${name}" (${columns.map((column) => `"${column}"`).join(',')}) VALUES (${columns.map((column) => literal(row[column] ?? null)).join(',')});`,
      );
    }
  }
  // Save credentials first, exclusively, so an interrupted import remains recoverable.
  await writePrivate(output, {
    target: 'twe-preview',
    databaseId: binding.database_id,
    createdAt: new Date().toISOString(),
    credentials,
  });
  const sqlPath = join(sandbox.directory, 'synthetic-preview.sql');
  await writeFile(sqlPath, statements.join('\n'), { mode: 0o600, flag: 'wx' });
  const child = Bun.spawn(
    [
      process.execPath,
      'x',
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--remote',
      '--config',
      'wrangler.jsonc',
      '--env',
      'preview',
      '--file',
      sqlPath,
    ],
    { stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' },
  );
  const [, , code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0)
    throw new Error(
      'Preview synthetic import failed; preserve credentials, inspect/recreate the isolated target before retrying.',
    );
  for (const name of names) {
    const rows = (await remote(`SELECT * FROM "${name}" ORDER BY id`))[0]
      ?.results;
    if (!rows || hashRows(rows) !== hashRows(source[name] ?? []))
      throw new Error('Synthetic preview reconciliation failed.');
  }
  await writePrivate(`${output}.report.json`, {
    completed: true,
    target: 'twe-preview',
    counts: Object.fromEntries(
      Object.entries(source).map(([name, rows]) => [name, rows.length]),
    ),
  });
  console.log(
    'Synthetic preview seeded and all application tables reconciled. Credentials remain in the restricted output file.',
  );
} finally {
  await platform?.dispose();
  await sandbox.dispose();
}
