/* eslint-disable security/detect-non-literal-fs-filename -- Explicit private recovery paths and an exclusively created temporary directory. */
import { Database } from 'bun:sqlite';
import { chmod, mkdtemp, open, readFile, rm } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertPrivatePath } from './model';

function identifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function literal(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

// D1 exports interleave CREATE TABLE and INSERT statements. With foreign keys
// enabled, even deferred checks cannot reference a table that does not exist.
// Let SQLite parse the complete dump offline, then emit all tables before data,
// and indexes/views/triggers afterward. Never split SQL on semicolons or regexes.
export async function prepareD1RestoreSql(input: string, output: string) {
  assertPrivatePath(input);
  assertPrivatePath(output);
  const directory = await mkdtemp(join(tmpdir(), 'twe-d1-restore-'));
  await chmod(directory, 0o700);
  let database: Database | undefined;
  let destination: FileHandle | undefined;
  let completed = false;
  try {
    const path = join(directory, 'offline.sqlite');
    database = new Database(path, { create: true });
    await chmod(path, 0o600);
    database.exec('PRAGMA foreign_keys=OFF;');
    database.exec(await readFile(input, 'utf8'));
    if (
      database
        .query<{ quick_check: string }, []>('PRAGMA quick_check')
        .all()
        .some((row) => row.quick_check !== 'ok') ||
      database.query('PRAGMA foreign_key_check').all().length
    )
      throw new Error('Invalid backup.');

    const schema = database
      .query<
        {
          type: 'table' | 'index' | 'view' | 'trigger';
          name: string;
          sql: string;
        },
        []
      >(
        "SELECT type,name,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name",
      )
      .all();
    const tables = schema.filter((item) => item.type === 'table');
    if (
      !tables.length ||
      tables.some((item) => !/^CREATE TABLE\b/i.test(item.sql))
    )
      throw new Error('Unsupported backup schema.');
    destination = await open(output, 'wx', 0o600);
    await destination.writeFile('PRAGMA defer_foreign_keys=TRUE;\n');
    for (const table of tables) await destination.writeFile(`${table.sql};\n`);

    let rows = 0;
    for (const table of tables) {
      const name = identifier(table.name);
      const columns = database
        .query<{ name: string; hidden: number }, []>(
          `PRAGMA table_xinfo(${name})`,
        )
        .all()
        .filter((column) => column.hidden === 0);
      const names = columns.map((column) => identifier(column.name));
      // Hex-encoded TEXT preserves NUL, Unicode, quotes and semicolons without
      // relying on a second SQL parser or exposing row contents in diagnostics.
      const values = names.map(
        (column) =>
          `CASE WHEN typeof(${column})='text' THEN 'CAST(X''' || hex(${column}) || ''' AS TEXT)' ELSE quote(${column}) END`,
      );
      const prefix = `INSERT INTO ${name}(${names.join(',')}) VALUES(`;
      const query = `SELECT ${literal(prefix)} || ${values.join(" || ',' || ")} || ');' AS statement FROM ${name}`;
      for (const row of database
        .query<{ statement: string }, []>(query)
        .iterate()) {
        await destination.writeFile(`${row.statement}\n`);
        rows++;
      }
    }
    if (
      database
        .query("SELECT 1 FROM sqlite_schema WHERE name='sqlite_sequence'")
        .get()
    ) {
      await destination.writeFile('DELETE FROM sqlite_sequence;\n');
      for (const row of database
        .query<
          { statement: string },
          []
        >("SELECT 'INSERT INTO sqlite_sequence(name,seq) VALUES(' || quote(name) || ',' || quote(seq) || ');' AS statement FROM sqlite_sequence")
        .iterate())
        await destination.writeFile(`${row.statement}\n`);
    }
    for (const type of ['index', 'view', 'trigger'] as const)
      for (const item of schema.filter((item) => item.type === type))
        await destination.writeFile(`${item.sql};\n`);
    completed = true;
    return { tables: tables.length, rows };
  } catch {
    // SQLite errors can echo SQL containing credential records or private data.
    throw new Error(
      'D1 restore preparation failed; verify the backup and use a new private output path.',
    );
  } finally {
    await destination?.close();
    if (destination && !completed) await rm(output, { force: true });
    database?.close();
    await rm(directory, { recursive: true, force: true });
  }
}
