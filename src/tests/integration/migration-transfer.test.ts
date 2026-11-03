import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { db, users, tutorials } from '../../db';
import { eq } from 'drizzle-orm';
import {
  hashRows,
  normalizeRow,
  tables,
  writePrivate,
  type Snapshot,
} from '../../../scripts/migration/model';
import { truncateTables } from './setup';

describe('Restricted snapshot transfer into real local D1', () => {
  test('round-trips UTC dates, JSON tags, identity and permissions; a rerun cannot overwrite rows', async () => {
    await truncateTables();
    const directory = await mkdtemp(join(tmpdir(), 'twe-migration-fixture-'));
    const input = join(directory, 'synthetic.json');
    const report = join(directory, 'report.json');
    const id = '00000000-0000-4000-8000-000000000099';
    const date = '2026-10-29T23:59:58.123';
    const user = normalizeRow('users', {
      id,
      email: 'migration@example.invalid',
      email_verified: true,
      name: 'Synthetic migrated account',
      image: null,
      created_at: date,
      updated_at: date,
      xp: 400,
      level: 2,
      role: 'ADMIN',
      profile_visibility: 'PRIVATE',
      show_on_leaderboard: false,
    });
    const tutorialId = '00000000-0000-4000-8000-000000000100';
    const tutorial = normalizeRow('tutorials', {
      id: tutorialId,
      slug: 'migration-fixture',
      title: { en: 'Fixture', id: 'Fixture ID' },
      order: 1,
      estimated_minutes: 5,
      tags: ['one', 'two'],
      is_published: true,
      view_count: 3,
      created_at: date,
      updated_at: date,
    });
    const snapshot: Snapshot = {
      format: 'twe-d1-snapshot-v1',
      sourceCommit: '0'.repeat(40),
      capturedAt: `${date}Z`,
      timestampInterpretation: 'UTC; integer milliseconds since Unix epoch',
      migrationHashes: [],
      tables: {},
    };
    for (const name of Object.keys(tables)) {
      const rows =
        name === 'users' ? [user] : name === 'tutorials' ? [tutorial] : [];
      snapshot.tables[name] = {
        rows,
        count: rows.length,
        sha256: hashRows(rows),
      };
    }
    try {
      await writePrivate(input, snapshot);
      const run = async (output: string) => {
        const child = Bun.spawn(
          [
            process.execPath,
            'scripts/migration/import-d1.ts',
            'import',
            input,
            output,
            'local',
          ],
          { env: process.env, stdout: 'ignore', stderr: 'ignore' },
        );
        return child.exited;
      };
      const firstExit = await run(report);
      if (firstExit !== 0) {
        const diagnostic: unknown = await readFile(report, 'utf8')
          .then((value) => JSON.parse(value) as unknown)
          .catch(() => 'Importer failed before writing its report.');
        throw new Error(
          `Synthetic import failed: ${JSON.stringify(diagnostic)}`,
        );
      }
      expect(firstExit).toBe(0);
      const transferred = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      expect(transferred?.createdAt.toISOString()).toBe(`${date}Z`);
      expect(transferred?.role).toBe('ADMIN');
      expect(transferred?.profileVisibility).toBe('PRIVATE');
      expect(transferred?.showOnLeaderboard).toBe(false);
      expect(
        (
          await db.query.tutorials.findFirst({
            where: eq(tutorials.id, tutorialId),
          })
        )?.tags,
      ).toEqual(['one', 'two']);
      const result: unknown = JSON.parse(await readFile(report, 'utf8'));
      expect(result).toMatchObject({
        completed: true,
        foreignKeyViolations: 0,
        quickCheck: ['ok'],
      });
      expect(await run(join(directory, 'rerun.json'))).toBe(1);
      expect(await db.query.users.findMany()).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
