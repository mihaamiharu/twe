/* eslint-disable security/detect-non-literal-fs-filename -- Input/report paths are explicitly restricted outside the checkout. */
/* eslint-disable security/detect-object-injection -- Names are checked against the fixed baseline schemas before lookup or SQL construction. */
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import {
  getTableConfig,
  type PgColumn,
  type PgTable,
} from 'drizzle-orm/pg-core';
import * as legacy from '../../src/db/legacy/postgres-schema';
import {
  assertPrivatePath,
  canonicalJson,
  hashRows,
  normalizeRow,
  postgresSelect,
  snapshotSchema,
  writePrivate,
  type Row,
} from './model';

const tables: Record<string, PgTable> = {
  users: legacy.users,
  sessions: legacy.sessions,
  accounts: legacy.accounts,
  verification: legacy.verification,
  tutorials: legacy.tutorials,
  challenges: legacy.challenges,
  test_cases: legacy.testCases,
  submissions: legacy.submissions,
  progress: legacy.progress,
  achievements: legacy.achievements,
  user_achievements: legacy.userAchievements,
  bug_reports: legacy.bugReports,
  newsletter_subscribers: legacy.newsletterSubscribers,
  contact_messages: legacy.contactMessages,
};
const diagnosticField = 'award_operation_id';

function coreRow(name: string, row: Row): Row {
  return name === 'user_achievements'
    ? Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== diagnosticField),
      )
    : row;
}

function valueForPostgres(
  column: PgColumn,
  value: Row[string],
): string | number | null {
  if (value === null || value === undefined) {
    if (column.notNull)
      throw new Error(`Required rollback field is missing: ${column.name}`);
    return null;
  }
  if (column.dataType === 'boolean') {
    if (value !== 0 && value !== 1)
      throw new Error(`Invalid rollback boolean: ${column.name}`);
    return value === 1 ? 'true' : 'false';
  }
  if (column.dataType === 'date') {
    if (typeof value !== 'number' || !Number.isSafeInteger(value))
      throw new Error(`Invalid rollback timestamp: ${column.name}`);
    return new Date(value).toISOString();
  }
  if (column.dataType === 'number') {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < -2147483648 ||
      value > 2147483647
    )
      throw new Error(`Invalid rollback integer: ${column.name}`);
    return value;
  }
  if (typeof value !== 'string')
    throw new Error(`Invalid rollback text/JSON: ${column.name}`);
  if (column.dataType === 'json')
    return canonicalJson(JSON.parse(value) as unknown);
  if (column.dataType === 'array') {
    const array: unknown = JSON.parse(value);
    if (
      !Array.isArray(array) ||
      array.some((item: unknown) => item !== null && typeof item !== 'string')
    )
      throw new Error(`Invalid rollback text array: ${column.name}`);
    return `{${array.map((item: string | null) => (item === null ? 'NULL' : `"${item.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`)).join(',')}}`;
  }
  const values: unknown = column.enumValues;
  if (Array.isArray(values) && !values.some((item: unknown) => item === value))
    throw new Error(`Invalid rollback enum: ${column.name}`);
  return value;
}

const [input, reportPath] = process.argv.slice(2);
const targetUrl = process.env['TWE_ROLLBACK_DATABASE_URL'];
if (!input || !reportPath || !targetUrl)
  throw new Error(
    'Usage: TWE_ROLLBACK_DATABASE_URL=… bun scripts/migration/restore-postgres.ts /private/frozen-d1.json /private/new-report.json [--apply-migrations]',
  );
assertPrivatePath(input);
assertPrivatePath(reportPath);
const snapshot = snapshotSchema.parse(
  JSON.parse(await readFile(input, 'utf8')) as unknown,
);
if (
  Object.keys(snapshot.tables).sort().join(',') !==
  Object.keys(tables).sort().join(',')
)
  throw new Error('Rollback snapshot table scope differs from the baseline.');
for (const [name, table] of Object.entries(snapshot.tables)) {
  if (
    table.rows.length !== table.count ||
    hashRows(table.rows) !== table.sha256
  )
    throw new Error(`${name}: rollback source checksum mismatch.`);
  const schema = tables[name];
  if (!schema) throw new Error('Unexpected rollback table.');
  const required = getTableConfig(schema)
    .columns.map((column) => column.name)
    .sort()
    .join(',');
  if (
    table.rows.some(
      (row) => Object.keys(coreRow(name, row)).sort().join(',') !== required,
    )
  )
    throw new Error(`${name}: unsupported rollback column scope.`);
}
const connection = postgres(targetUrl, { max: 1, prepare: false });
const startedAt = Date.now();
const report = {
  completed: false,
  sourceCommit: snapshot.sourceCommit,
  elapsedMs: 0,
  ignoredDiagnostics: ['user_achievements.award_operation_id'],
  tables: {} as Record<
    string,
    {
      count: number;
      matches: boolean;
      sha256: string;
      differingColumns?: Record<string, number>;
    }
  >,
  failure: '',
};
try {
  if (process.argv.includes('--apply-migrations')) {
    const existing = await connection<
      { total: number }[]
    >`SELECT count(*)::int AS total FROM pg_tables WHERE schemaname IN ('public', 'drizzle')`;
    if (existing[0]?.total !== 0)
      throw new Error(
        'Applying recovery migrations requires a fresh empty PostgreSQL database.',
      );
    await migrate(drizzle(connection), {
      migrationsFolder: 'drizzle/migrations',
    });
  }
  for (const name of Object.keys(tables)) {
    const count = await connection.unsafe<{ total: number }[]>(
      `SELECT count(*)::int AS total FROM "${name}"`,
    );
    if (count[0]?.total !== 0)
      throw new Error(
        'Recovery target contains application data; no write locks or row changes were requested.',
      );
  }
  await connection.begin(
    'isolation level serializable',
    async (transaction) => {
      await transaction`SET LOCAL TIME ZONE 'UTC'`;
      await transaction`SET LOCAL lock_timeout = '5s'`;
      // Read/write lock prevents a second operator/app from making this an
      // accidental merge. This tool restores a complete frozen source to a fresh DB.
      await transaction.unsafe(
        `LOCK TABLE ${Object.keys(tables)
          .map((name) => `"${name}"`)
          .join(',')} IN ACCESS EXCLUSIVE MODE`,
      );
      for (const name of Object.keys(tables)) {
        const count = await transaction.unsafe<{ total: number }[]>(
          `SELECT count(*)::int AS total FROM "${name}"`,
        );
        if (count[0]?.total !== 0)
          throw new Error(
            'Recovery target contains application data; no rows were overwritten.',
          );
      }
      for (const [name, table] of Object.entries(tables)) {
        const columns = getTableConfig(table).columns;
        const query = `INSERT INTO "${name}" (${columns.map((column) => `"${column.name}"`).join(',')}) VALUES (${columns.map((column, index) => `$${index + 1}::${column.getSQLType()}`).join(',')})`;
        for (const row of snapshot.tables[name]?.rows ?? []) {
          // Force the text codec, then use the explicit schema cast in SQL.
          // Otherwise postgres-js infers bool/JSON/array serializers from the
          // cast and can reinterpret an already encoded recovery value.
          await transaction.unsafe(
            query,
            columns.map((column) => {
              const value = valueForPostgres(column, row[column.name] ?? null);
              return transaction.typed(
                value === null ? null : String(value),
                25,
              );
            }),
          );
        }
      }
      for (const name of Object.keys(tables)) {
        const target = await transaction.unsafe<
          {
            value: Record<string, unknown>;
            json_nulls: Record<string, boolean>;
          }[]
        >(postgresSelect(name));
        const rows = target.map((record) =>
          coreRow(name, normalizeRow(name, record.value, record.json_nulls)),
        );
        const source = snapshot.tables[name];
        if (!source) throw new Error('Rollback source table is missing.');
        const digest = hashRows(rows);
        const matches =
          rows.length === source.count &&
          digest === hashRows(source.rows.map((row) => coreRow(name, row)));
        report.tables[name] = { count: rows.length, matches, sha256: digest };
        if (!matches) {
          const sourceById = new Map(
            source.rows.map((row) => [row['id'], coreRow(name, row)]),
          );
          const differingColumns = new Map<string, number>();
          for (const row of rows) {
            const expected = sourceById.get(row['id']);
            for (const [key, value] of Object.entries(row))
              if (JSON.stringify(value) !== JSON.stringify(expected?.[key]))
                differingColumns.set(key, (differingColumns.get(key) ?? 0) + 1);
          }
          report.tables[name] = {
            count: rows.length,
            matches,
            sha256: digest,
            differingColumns: Object.fromEntries(differingColumns),
          };
          throw new Error(
            `${name}: rollback reconciliation mismatch; transaction will be rolled back.`,
          );
        }
      }
    },
  );
  report.completed = true;
  console.log(
    JSON.stringify({
      event: 'postgres_recovery_snapshot_restored',
      completed: true,
      counts: Object.fromEntries(
        Object.entries(report.tables).map(([name, table]) => [
          name,
          table.count,
        ]),
      ),
    }),
  );
} catch (error) {
  report.failure =
    error instanceof Error
      ? error.message
      : 'PostgreSQL recovery restore failed.';
  process.exitCode = 1;
  console.error(
    'PostgreSQL recovery restore failed; inspect only the restricted report.',
  );
} finally {
  await connection.end();
  report.elapsedMs = Date.now() - startedAt;
  await writePrivate(reportPath, report);
}
