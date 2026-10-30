import { getRuntimeEnv, closeRuntime } from '#platform';
import { hashPassword } from 'better-auth/crypto';
import { runProgressRewardTransaction } from '../../src/server/progress-rewards';

const env = getRuntimeEnv();
if (
  env.APP_ENV !== 'test' ||
  !process.env['TWE_WRANGLER_CONFIG']?.includes('test-runs') ||
  process.env['TWE_REHEARSAL_SYNTHETIC_WRITES'] !== 'yes'
)
  throw new Error(
    'Synthetic post-cutover writes require an explicitly selected disposable local rehearsal dataset.',
  );

try {
  const userId = crypto.randomUUID();
  const challengeId = crypto.randomUUID();
  const now = Date.now();
  const password = await hashPassword('Synthetic-rollback-only-password-2026');
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO users (id, email, email_verified, name, role, profile_visibility, show_on_leaderboard, created_at, updated_at) VALUES (?, ?, 1, ?, 'USER', 'PRIVATE', 0, ?, ?)",
    ).bind(
      userId,
      `rollback-${userId}@example.invalid`,
      'Synthetic post-cutover account',
      now,
      now,
    ),
    env.DB.prepare(
      "INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES (?, ?, ?, 'credential', ?, ?, ?)",
    ).bind(crypto.randomUUID(), userId, userId, password, now, now),
    env.DB.prepare(
      "INSERT INTO challenges (id, slug, title, type, difficulty, xp_reward, \"order\", tags, hints, is_published, created_at, updated_at) VALUES (?, ?, ?, 'JAVASCRIPT', 'EASY', 100, 1, ?, ?, 1, ?, ?)",
    ).bind(
      challengeId,
      `recovery-${challengeId}`,
      JSON.stringify({ id: 'Synthetic ID', en: 'Synthetic EN' }),
      JSON.stringify(['comma, brace}', 'quote " slash \\', null]),
      'null',
      now,
      now,
    ),
    env.DB.prepare(
      'INSERT INTO test_cases (id, challenge_id, description, input, expected_output, "order", created_at) VALUES (?, ?, ?, ?, NULL, 1, ?)',
    ).bind(
      crypto.randomUUID(),
      challengeId,
      'JSON null versus SQL NULL fixture',
      'null',
      now,
    ),
    env.DB.prepare(
      'INSERT INTO progress (id, user_id, challenge_id, used_hint, hint_content, last_accessed_at, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)',
    ).bind(
      crypto.randomUUID(),
      userId,
      challengeId,
      'Synthetic saved hint',
      now,
      now,
      now,
    ),
    env.DB.prepare(
      'INSERT INTO contact_messages (id, name, email, topic, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      crypto.randomUUID(),
      'Synthetic recovery fixture',
      'recovery@example.invalid',
      'general',
      'A new write made after the simulated cutover.',
      now,
      now,
    ),
  ]);
  const result = await runProgressRewardTransaction({
    userId,
    target: { kind: 'challenge', challengeId, xpReward: 100 },
    shouldComplete: true,
    submission: {
      code: 'synthetic post-cutover submission',
      isPassed: true,
      testsPassed: 1,
      testsTotal: 1,
    },
  });
  if (!result.isFirstCompletion || result.xpAwarded !== 50)
    throw new Error('Synthetic post-cutover reward fixture failed.');
  await env.DB.prepare(
    "UPDATE app_control SET value = 1 WHERE key = 'writes_frozen'",
  ).run();
  console.log(
    'Synthetic post-cutover account/content/submission/reward/contact writes completed; the private D1 source is now frozen.',
  );
} finally {
  await closeRuntime();
}
