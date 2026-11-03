import { getRuntimeEnv } from '#platform';

export async function clientIdentifier(
  headers: Headers,
  userId?: string,
): Promise<string> {
  if (userId) return `user:${userId}`;
  const env = getRuntimeEnv();
  // CF supplies this header on deployed Workers; arbitrary forwarding headers
  // are never trusted. Local/test traffic has a separate local-only bucket.
  const ip =
    env.APP_ENV === 'local' || env.APP_ENV === 'test'
      ? 'local'
      : headers.get('cf-connecting-ip');
  if (!ip) throw new Error('Client identity is unavailable.');
  return `ip:${await hashIdentifier(ip)}`;
}

export async function hashIdentifier(value: string): Promise<string> {
  const env = getRuntimeEnv();
  if (!env.BETTER_AUTH_SECRET)
    throw new Error('Rate limit key is unavailable.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.BETTER_AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Strict global first-request anchored windows, persisted in D1. */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  sliding = false,
): Promise<{ allowed: boolean; resetAt: number }> {
  const now = Date.now();
  const binding = getRuntimeEnv().DB;
  const row = await binding
    .prepare(
      `
    INSERT INTO rate_limit_buckets (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
      reset_at = CASE WHEN reset_at <= ? OR ? = 1 THEN excluded.reset_at ELSE reset_at END
    WHERE reset_at <= ? OR count < ?
    RETURNING reset_at AS resetAt
  `,
    )
    .bind(key, now + windowMs, now, now, Number(sliding), now, limit)
    .first<{ resetAt: number }>();
  if (row) return { allowed: true, resetAt: row.resetAt };
  const existing = await binding
    .prepare('SELECT reset_at AS resetAt FROM rate_limit_buckets WHERE key = ?')
    .bind(key)
    .first<{ resetAt: number }>();
  return { allowed: false, resetAt: existing?.resetAt ?? now + windowMs };
}
