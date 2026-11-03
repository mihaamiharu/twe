import postgres from 'postgres';
import {
  assertPrivatePath,
  hashRows,
  normalizeRow,
  postgresSelect,
  snapshotSchema,
  tables,
  writePrivate,
  type Snapshot,
} from './model';

const output = process.argv[2];
const sourceCommit = process.argv[3];
const sourceUrl = process.env['TWE_SOURCE_DATABASE_URL'];
if (
  !output ||
  !sourceCommit ||
  !/^[a-f0-9]{40}$/.test(sourceCommit) ||
  !sourceUrl
)
  throw new Error(
    'Usage: TWE_SOURCE_DATABASE_URL=… bun scripts/migration/export-postgres.ts /private/snapshot.json <deployed-commit-sha>',
  );

assertPrivatePath(output);

const connection = postgres(sourceUrl, { max: 1, prepare: false });
try {
  const snapshot = await connection.begin(
    'isolation level repeatable read read only',
    async (transaction) => {
      const hashes = await transaction<
        { hash: string }[]
      >`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`;
      const result: Snapshot = {
        format: 'twe-d1-snapshot-v1',
        sourceCommit,
        capturedAt: new Date().toISOString(),
        timestampInterpretation: 'UTC; integer milliseconds since Unix epoch',
        migrationHashes: hashes.map((row) => row.hash),
        tables: {},
      };
      for (const name of Object.keys(tables)) {
        // Table names come only from the fixed schema map.
        const records = await transaction.unsafe<
          {
            value: Record<string, unknown>;
            json_nulls: Record<string, boolean>;
          }[]
        >(postgresSelect(name));
        const rows = records.map((record) =>
          normalizeRow(name, record.value, record.json_nulls),
        );
        // eslint-disable-next-line security/detect-object-injection -- name comes only from the fixed application table map.
        result.tables[name] = {
          rows,
          count: rows.length,
          sha256: hashRows(rows),
        };
      }
      return snapshotSchema.parse(result);
    },
  );
  await writePrivate(output, snapshot);
  console.log(
    JSON.stringify({
      event: 'postgres_snapshot_exported',
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
    'PostgreSQL export failed. No credentials or row contents are included in diagnostics.',
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
