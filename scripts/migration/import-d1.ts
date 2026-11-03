/* eslint-disable security/detect-non-literal-fs-filename -- Snapshot/report paths must pass assertPrivatePath before use. */
/* eslint-disable security/detect-object-injection -- Snapshot keys and column scope are checked against the fixed schema before query construction. */
import { readFile } from 'node:fs/promises';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { createD1Client, type Query } from './d1-client';
import {
  assertPrivatePath,
  hashRows,
  rowSchema,
  snapshotSchema,
  tables,
  writePrivate,
  type Row,
} from './model';

const mode = z.enum(['import', 'validate']).parse(process.argv[2]);
const input = process.argv[3];
const reportPath = process.argv[4];
const target = z
  .enum(['local', 'preview', 'production'])
  .parse(process.argv[5] ?? 'local');
if (!input || !reportPath)
  throw new Error(
    'Usage: bun scripts/migration/import-d1.ts <import|validate> /private/snapshot.json /private/new-report.json [local|preview|production]',
  );
assertPrivatePath(input);
assertPrivatePath(reportPath);
const raw: unknown = JSON.parse(await readFile(input, 'utf8'));
const snapshot = snapshotSchema.parse(raw);
if (
  Object.keys(snapshot.tables).sort().join(',') !==
  Object.keys(tables).sort().join(',')
)
  throw new Error('Snapshot table scope does not match the migration schema.');
for (const [name, table] of Object.entries(snapshot.tables)) {
  if (
    table.count !== table.rows.length ||
    table.sha256 !== hashRows(table.rows)
  )
    throw new Error(`${name}: snapshot checksum/count mismatch.`);
  const schema = tables[name];
  if (!schema) throw new Error('Unexpected snapshot table.');
  const columns = getTableConfig(schema)
    .columns.map((column) => column.name)
    .sort()
    .join(',');
  if (table.rows.some((row) => Object.keys(row).sort().join(',') !== columns))
    throw new Error(`${name}: snapshot column scope mismatch.`);
}
const client = await createD1Client(target);
const startedAt = Date.now();
const report: {
  sourceCommit: string;
  target: string;
  mode: string;
  completed: boolean;
  elapsedMs: number;
  tables: Record<string, { count: number; sha256: string; matches: boolean }>;
  foreignKeyViolations: number;
  quickCheck: string[];
  failure?: string;
} = {
  sourceCommit: snapshot.sourceCommit,
  target,
  mode,
  completed: false,
  elapsedMs: 0,
  tables: {},
  foreignKeyViolations: 0,
  quickCheck: [],
};
try {
  if (mode === 'import') {
    // Reruns fail before writing; never overwrite a partially imported or live DB.
    const names = [
      ...Object.keys(tables),
      'reward_operations',
      'rate_limit_buckets',
    ];
    const counts = await client.run(
      names.map((name) => ({ sql: `SELECT count(*) AS total FROM "${name}"` })),
    );
    if (counts.some((rows) => rows[0]?.['total'] !== 0))
      throw new Error(
        'Target is not empty. Recreate the isolated target, apply migrations, and restart; no data has been overwritten.',
      );
    let pending: Query[] = [];
    let bytes = 0;
    const flush = async () => {
      if (pending.length) await client.run(pending);
      pending = [];
      bytes = 0;
    };
    for (const [name, table] of Object.entries(snapshot.tables)) {
      for (const row of table.rows) {
        const columns = Object.keys(row).sort();
        const query: Query = {
          sql: `INSERT INTO "${name}" (${columns.map((column) => `"${column}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
          params: columns.map((column) => row[column] ?? null),
        };
        const size = new TextEncoder().encode(JSON.stringify(query)).byteLength;
        if (pending.length >= 50 || bytes + size > 512 * 1024) await flush();
        pending.push(query);
        bytes += size;
      }
    }
    await flush();
  }
  for (const [name, table] of Object.entries(snapshot.tables)) {
    const columns = Object.keys(table.rows[0] ?? {}).sort();
    const selected = columns.length
      ? columns.map((column) => `"${column}"`).join(',')
      : '*';
    const largest = Math.max(
      1,
      ...table.rows.map(
        (row) => new TextEncoder().encode(JSON.stringify(row)).byteLength,
      ),
    );
    const pageSize = Math.max(
      1,
      Math.min(100, Math.floor((512 * 1024) / largest)),
    );
    const rows: Row[] = [];
    let cursor = '';
    while (true) {
      const page = rowSchema.array().parse(
        (
          await client.run([
            {
              sql: `SELECT ${selected} FROM "${name}" WHERE id > ? ORDER BY id LIMIT ?`,
              params: [cursor, pageSize],
            },
          ])
        )[0],
      );
      if (!page.length) break;
      rows.push(...page);
      cursor = String(page.at(-1)?.['id']);
    }
    const digest = hashRows(rows);
    report.tables[name] = {
      count: rows.length,
      sha256: digest,
      matches: rows.length === table.count && digest === table.sha256,
    };
  }
  const [foreignKeys, integrity] = await client.run([
    { sql: 'PRAGMA foreign_key_check' },
    { sql: 'PRAGMA quick_check' },
  ]);
  report.foreignKeyViolations = foreignKeys?.length ?? 0;
  report.quickCheck = (integrity ?? []).map((row) =>
    String(Object.values(row)[0]),
  );
  report.completed =
    Object.values(report.tables).every((table) => table.matches) &&
    report.foreignKeyViolations === 0 &&
    report.quickCheck.length === 1 &&
    report.quickCheck[0] === 'ok';
  if (!report.completed)
    throw new Error(
      'Source/target integrity differs; inspect the restricted report before continuing.',
    );
} catch (error) {
  report.failure = error instanceof Error ? error.message : 'Migration failed.';
  process.exitCode = 1;
} finally {
  report.elapsedMs = Date.now() - startedAt;
  await client.dispose();
  await writePrivate(reportPath, report);
  console.log(
    JSON.stringify({
      event: 'd1_migration_finished',
      completed: report.completed,
      target,
      elapsedMs: report.elapsedMs,
    }),
  );
}
