import { beforeEach, describe, expect, test } from 'bun:test';
import { getRuntimeEnv } from '#platform';
import { consumeRateLimit, clientIdentifier } from '../../server/rate-limit';
import { truncateTables } from './setup';

describe('Atomic D1 rate windows', () => {
  beforeEach(truncateTables);

  test('concurrent requests accept exactly the configured hourly allowance', async () => {
    const requests = await Promise.all(
      Array.from({ length: 15 }, () =>
        consumeRateLimit('fixture:hour', 3, 3_600_000),
      ),
    );
    expect(requests.filter((item) => item.allowed)).toHaveLength(3);
    await getRuntimeEnv()
      .DB.prepare('UPDATE rate_limit_buckets SET reset_at = ? WHERE key = ?')
      .bind(Date.now() - 1, 'fixture:hour')
      .run();
    expect((await consumeRateLimit('fixture:hour', 3, 3_600_000)).allowed).toBe(
      true,
    );
  });

  test('deployed anonymous identity ignores spoofed forwarding headers', async () => {
    const env = getRuntimeEnv();
    const original = env.APP_ENV;
    try {
      env.APP_ENV = 'production';
      const trusted = new Headers({
        'cf-connecting-ip': '192.0.2.5',
        'x-forwarded-for': '198.51.100.1',
      });
      const spoofed = new Headers({
        'cf-connecting-ip': '192.0.2.5',
        'x-forwarded-for': '198.51.100.2',
      });
      const identity = await clientIdentifier(trusted);
      expect(identity).toBe(await clientIdentifier(spoofed));
      expect(identity).not.toContain('192.0.2.5');
      expect(await clientIdentifier(trusted, 'synthetic-user')).toBe(
        'user:synthetic-user',
      );
      await clientIdentifier(
        new Headers({ 'x-forwarded-for': '198.51.100.1' }),
      ).then(
        () => {
          throw new Error('Spoofed client identity was accepted.');
        },
        (error: unknown) => {
          expect(error).toBeInstanceOf(Error);
        },
      );
    } finally {
      env.APP_ENV = original;
    }
  });
});
