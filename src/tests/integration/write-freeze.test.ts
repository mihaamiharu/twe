import { beforeEach, describe, expect, test } from 'bun:test';
import { getRuntimeEnv } from '#platform';
import { db, users } from '../../db';
import { truncateTables } from './setup';

describe('D1 database write freeze', () => {
  beforeEach(async () => {
    await getRuntimeEnv()
      .DB.prepare(
        "UPDATE app_control SET value = 0 WHERE key = 'writes_frozen'",
      )
      .run();
    await truncateTables();
  });

  test('blocks INSERT/UPDATE/DELETE, including a previously constructed batch, without blocking reads', async () => {
    const binding = getRuntimeEnv().DB;
    const id = crypto.randomUUID();
    await db
      .insert(users)
      .values({ id, email: 'freeze@example.invalid', name: 'Before freeze' });
    const queued = [
      binding.prepare('UPDATE users SET xp = xp + 100 WHERE id = ?').bind(id),
    ];
    await binding
      .prepare("UPDATE app_control SET value = 1 WHERE key = 'writes_frozen'")
      .run();
    let denied = 0;
    try {
      const operations = [
        () => binding.batch(queued),
        () =>
          binding
            .prepare('INSERT INTO users (id, email) VALUES (?, ?)')
            .bind(crypto.randomUUID(), 'blocked@example.invalid')
            .run(),
        () => binding.prepare('DELETE FROM users WHERE id = ?').bind(id).run(),
        () =>
          binding
            .prepare(
              'INSERT INTO rate_limit_buckets (key, count, reset_at) VALUES (?, 1, ?)',
            )
            .bind('frozen-test', Date.now())
            .run(),
      ];
      for (const operation of operations) {
        try {
          await operation();
        } catch (error) {
          expect(String(error)).toContain('Application writes are frozen');
          denied++;
        }
      }
      expect(denied).toBe(4);
      expect(await db.query.users.findMany()).toMatchObject([
        { id, xp: 0, name: 'Before freeze' },
      ]);
    } finally {
      await binding
        .prepare("UPDATE app_control SET value = 0 WHERE key = 'writes_frozen'")
        .run();
    }
    await binding
      .prepare('UPDATE users SET xp = xp + 1 WHERE id = ?')
      .bind(id)
      .run();
    expect((await db.query.users.findMany())[0]?.xp).toBe(1);
  });
});
