/* eslint-disable security/detect-non-literal-fs-filename -- Sensitive output paths are checked by assertPrivatePath before filesystem writes. */
/* eslint-disable security/detect-object-injection -- Column/table names come from the fixed Drizzle schema, never executable method selection. */
import { createHash } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as schema from '../../src/db/schema';
import { z } from 'zod';

// Parent-first order keeps foreign keys enabled throughout import.
export const tables: Record<string, SQLiteTable> = {
  users: schema.users,
  sessions: schema.sessions,
  accounts: schema.accounts,
  verification: schema.verification,
  tutorials: schema.tutorials,
  challenges: schema.challenges,
  test_cases: schema.testCases,
  submissions: schema.submissions,
  progress: schema.progress,
  achievements: schema.achievements,
  user_achievements: schema.userAchievements,
  bug_reports: schema.bugReports,
  newsletter_subscribers: schema.newsletterSubscribers,
  contact_messages: schema.contactMessages,
};

export const cellSchema = z.union([z.string(), z.number().finite(), z.null()]);
export const rowSchema = z.record(z.string(), cellSchema);
export const snapshotSchema = z.object({
  format: z.literal('twe-d1-snapshot-v1'),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  capturedAt: z.string(),
  timestampInterpretation: z.literal(
    'UTC; integer milliseconds since Unix epoch',
  ),
  migrationHashes: z.array(z.string()),
  tables: z.record(
    z.string(),
    z.object({
      rows: z.array(rowSchema),
      sha256: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Row = z.infer<typeof rowSchema>;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

export function hashRows(rows: Row[]): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        canonical(
          [...rows].sort((left, right) =>
            String(left['id']).localeCompare(String(right['id'])),
          ),
        ),
      ),
    )
    .digest('hex');
}

export function normalizeRow(
  tableName: string,
  input: Record<string, unknown>,
): Row {
  const table = tables[tableName];
  if (!table) throw new Error('Unexpected source table.');
  const known = new Set(
    getTableConfig(table).columns.map((column) => column.name),
  );
  if (Object.keys(input).some((name) => !known.has(name)))
    throw new Error(
      `${tableName}: unrecognized source column; update the mapping before exporting.`,
    );
  const row: Row = {};
  for (const column of getTableConfig(table).columns) {
    const value = input[column.name] ?? null;
    if (value === null) {
      if (column.notNull)
        throw new Error(
          `${tableName}.${column.name}: required value is missing.`,
        );
      row[column.name] = null;
    } else if (column.dataType === 'date') {
      if (typeof value !== 'string')
        throw new Error(`${tableName}.${column.name}: invalid timestamp.`);
      // PostgreSQL timestamp-without-time-zone is the app's UTC wall clock.
      const utc = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`;
      const milliseconds = Date.parse(utc);
      if (!Number.isSafeInteger(milliseconds))
        throw new Error(`${tableName}.${column.name}: invalid timestamp.`);
      row[column.name] = milliseconds;
    } else if (column.dataType === 'boolean') {
      if (typeof value !== 'boolean')
        throw new Error(`${tableName}.${column.name}: invalid boolean.`);
      row[column.name] = value ? 1 : 0;
    } else if (column.dataType === 'json') {
      row[column.name] = JSON.stringify(canonical(value));
    } else if (column.dataType === 'number') {
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < -2147483648 ||
        value > 2147483647
      )
        throw new Error(
          `${tableName}.${column.name}: invalid PostgreSQL integer.`,
        );
      row[column.name] = value;
    } else {
      if (typeof value !== 'string')
        throw new Error(`${tableName}.${column.name}: invalid string.`);
      const enumValues: unknown = column.enumValues;
      if (
        Array.isArray(enumValues) &&
        !enumValues.some((item: unknown) => item === value)
      )
        throw new Error(`${tableName}.${column.name}: invalid enum.`);
      row[column.name] = value;
    }
  }
  if (typeof row['id'] !== 'string' || !z.uuid().safeParse(row['id']).success)
    throw new Error(`${tableName}.id: invalid UUID.`);
  return row;
}

export function assertPrivatePath(path: string) {
  const root = resolve(import.meta.dirname, '../..');
  const resolved = resolve(path);
  const inside = relative(root, resolved);
  if (!isAbsolute(path) || (!inside.startsWith('..') && !isAbsolute(inside)))
    throw new Error(
      'Sensitive artifacts must use an absolute path outside the repository.',
    );
  return resolved;
}

export async function writePrivate(path: string, value: unknown) {
  const resolved = assertPrivatePath(path);
  await mkdir(dirname(resolved), { recursive: true, mode: 0o700 });
  await chmod(dirname(resolved), 0o700);
  await writeFile(resolved, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
    flag: 'wx',
  });
}
