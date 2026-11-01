import { Database } from 'bun:sqlite';
import { test, expect } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareD1RestoreSql } from '../../../scripts/migration/d1-restore-sql';

test('reorders child-first exports without losing SQL text, bytes, sequences or freeze triggers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'twe-restore-test-'));
  const source = join(directory, 'source.sql');
  const output = join(directory, 'restore.sql');
  const database = new Database(':memory:');
  try {
    await writeFile(
      source,
      `
      PRAGMA defer_foreign_keys=TRUE;
      CREATE TABLE children (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parents(id), content TEXT, bytes BLOB);
      INSERT INTO children VALUES(1,1,CAST(X'6100273B0AF09F918B' AS TEXT),X'0001FF');
      CREATE TABLE parents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
      INSERT INTO parents VALUES(1,'semi; quote'' and -- comment');
      INSERT INTO parents VALUES(9,'removed');
      DELETE FROM parents WHERE id=9;
      CREATE TABLE app_control(key TEXT PRIMARY KEY,value INTEGER);
      INSERT INTO app_control VALUES('writes_frozen',1);
      CREATE INDEX children_parent ON children(parent_id);
      CREATE VIEW child_view AS SELECT content FROM children;
      CREATE TRIGGER freeze_parent BEFORE UPDATE ON parents
      WHEN (SELECT value FROM app_control WHERE key='writes_frozen')=1
      BEGIN SELECT RAISE(ABORT,'Application writes are frozen'); END;
    `,
    );
    expect(await prepareD1RestoreSql(source, output)).toEqual({
      tables: 3,
      rows: 3,
    });
    database.exec('PRAGMA foreign_keys=ON; BEGIN;');
    database.exec(await readFile(output, 'utf8'));
    database.exec('COMMIT;');
    expect(
      database
        .query<{ content: string }, []>('SELECT content FROM children')
        .get()?.content,
    ).toBe("a\0';\n👋");
    expect(
      database
        .query<{ hex: string }, []>('SELECT hex(bytes) AS hex FROM children')
        .get()?.hex,
    ).toBe('0001FF');
    expect(
      database
        .query<
          { seq: number },
          []
        >("SELECT seq FROM sqlite_sequence WHERE name='parents'")
        .get()?.seq,
    ).toBe(9);
    expect(database.query('PRAGMA foreign_key_check').all()).toHaveLength(0);
    expect(
      database.query('SELECT content FROM child_view').get(),
    ).toBeDefined();
    expect(() =>
      database.exec("UPDATE parents SET name='changed' WHERE id=1"),
    ).toThrow('Application writes are frozen');
    expect(
      database
        .query("SELECT name FROM sqlite_schema WHERE name='children_parent'")
        .get(),
    ).toBeDefined();
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects invalid foreign keys without overwriting existing output or exposing row contents', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'twe-restore-test-'));
  const source = join(directory, 'source.sql');
  const output = join(directory, 'restore.sql');
  try {
    await writeFile(
      source,
      'CREATE TABLE parents(id INTEGER PRIMARY KEY); CREATE TABLE children(id INTEGER REFERENCES parents(id)); INSERT INTO children VALUES(42);',
    );
    await writeFile(output, 'existing recovery file');
    let message = '';
    try {
      await prepareD1RestoreSql(source, output);
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toBe(
      'D1 restore preparation failed; verify the backup and use a new private output path.',
    );
    expect(await readFile(output, 'utf8')).toBe('existing recovery file');
    await writeFile(source, 'CREATE TABLE parents(id INTEGER PRIMARY KEY);');
    try {
      await prepareD1RestoreSql(source, output);
    } catch {
      /* The exclusive destination must also reject a valid backup. */
    }
    expect(await readFile(output, 'utf8')).toBe('existing recovery file');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
