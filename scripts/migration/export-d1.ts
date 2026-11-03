/* eslint-disable security/detect-object-injection -- Names are from the fixed migration schema and validated column metadata. */
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { z } from 'zod';
import { createD1Client } from './d1-client';
import {
  assertPrivatePath,
  canonicalJson,
  hashRows,
  rowSchema,
  tables,
  writePrivate,
  type Row,
  type Snapshot,
} from './model';

const output = process.argv[2];
const sourceCommit = process.argv[3];
const target = z
  .enum(['local', 'preview', 'production'])
  .parse(process.argv[4] ?? 'local');
if (!output || !sourceCommit || !/^[a-f0-9]{40}$/.test(sourceCommit))
  throw new Error(
    'Usage: bun scripts/migration/export-d1.ts /private/new-snapshot.json <worker-commit-sha> [local|preview|production]',
  );
assertPrivatePath(output);
const client = await createD1Client(target);
const snapshot: Snapshot = {
  format: 'twe-d1-snapshot-v1',
  sourceCommit,
  capturedAt: new Date().toISOString(),
  timestampInterpretation: 'UTC; integer milliseconds since Unix epoch',
  migrationHashes: readMigrationFiles({
    migrationsFolder: 'drizzle/migrations',
  }).map((migration) => migration.hash),
  tables: {},
};
try {
  const freeze = (
    await client.run([
      { sql: "SELECT value FROM app_control WHERE key = 'writes_frozen'" },
    ])
  )[0]?.[0];
  if (freeze?.['value'] !== 1)
    throw new Error(
      'Enable the D1 database write freeze before exporting a recovery snapshot.',
    );
  for (const [name, table] of Object.entries(tables)) {
    const columns = getTableConfig(table).columns;
    const selected = columns.map((column) => `"${column.name}"`).join(', ');
    const byteEstimate = columns
      .map((column) => `COALESCE(length(CAST("${column.name}" AS BLOB)), 0)`)
      .join(' + ');
    const rows: Row[] = [];
    let cursor = '';
    while (true) {
      const metadata = z
        .array(z.object({ id: z.string(), bytes: z.number() }))
        .parse(
          (
            await client.run([
              {
                sql: `SELECT id, (${byteEstimate}) AS bytes FROM "${name}" WHERE id > ? ORDER BY id LIMIT 100`,
                params: [cursor],
              },
            ])
          )[0],
        );
      if (!metadata.length) break;
      let group: string[] = [];
      let size = 0;
      const flush = async () => {
        if (!group.length) return;
        const page = rowSchema
          .array()
          .parse(
            (
              await client.run([
                {
                  sql: `SELECT ${selected} FROM "${name}" WHERE id IN (${group.map(() => '?').join(',')}) ORDER BY id`,
                  params: group,
                },
              ])
            )[0],
          );
        for (const row of page)
          for (const column of columns) {
            const raw = row[column.name];
            if (column.dataType === 'json' && typeof raw === 'string')
              row[column.name] = canonicalJson(JSON.parse(raw) as unknown);
          }
        rows.push(...page);
        group = [];
        size = 0;
      };
      for (const record of metadata) {
        if (group.length >= 50 || size + record.bytes > 256 * 1024)
          await flush();
        group.push(record.id);
        size += record.bytes;
      }
      await flush();
      cursor = metadata.at(-1)?.id ?? cursor;
    }
    snapshot.tables[name] = {
      rows,
      count: rows.length,
      sha256: hashRows(rows),
    };
  }
  await writePrivate(output, snapshot);
  console.log(
    JSON.stringify({
      event: 'frozen_d1_snapshot_exported',
      counts: Object.fromEntries(
        Object.entries(snapshot.tables).map(([name, table]) => [
          name,
          table.count,
        ]),
      ),
    }),
  );
} catch {
  console.error(
    'Frozen D1 export failed; no row data is included in diagnostics.',
  );
  process.exitCode = 1;
} finally {
  await client.dispose();
}
