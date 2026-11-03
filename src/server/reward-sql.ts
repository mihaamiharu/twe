import { getRuntimeEnv } from '#platform';
import { ACHIEVEMENTS, type Achievement } from '@/lib/achievements';

export function levelUpdate(userId: string) {
  return getRuntimeEnv()
    .DB.prepare(
      `
    UPDATE users SET level = (
      WITH RECURSIVE levels(n) AS (
        SELECT 1 UNION ALL SELECT n + 1 FROM levels
        WHERE 100 * (n + 1) * (n + 1) <= users.xp
      ) SELECT MAX(n) FROM levels
    ) WHERE id = ?
  `,
    )
    .bind(userId);
}

/** Eligibility is evaluated in SQL against the batch's current state. */
function criterion(achievement: Achievement): string {
  const target = achievement.criteria.target;
  if (!Number.isSafeInteger(target) || target < 0)
    throw new Error('Invalid achievement target.');
  const completed =
    'FROM progress p WHERE p.user_id = u.id AND p.is_completed = 1';
  switch (achievement.criteria.type) {
    case 'xp':
      return `u.xp >= ${target}`;
    case 'level':
      return `u.level >= ${target}`;
    case 'count': {
      if (achievement.id === 'bug-squasher')
        return `(SELECT count(*) FROM bug_reports b WHERE b.user_id = u.id) >= ${target}`;
      if (achievement.criteria.challengeType) {
        const type = achievement.criteria.challengeType;
        if (!/^[A-Z_]+$/.test(type))
          throw new Error('Invalid achievement type.');
        return `(SELECT count(*) FROM progress p JOIN challenges c ON c.id = p.challenge_id WHERE p.user_id = u.id AND p.is_completed = 1 AND c.type = '${type}') >= ${target}`;
      }
      return `(SELECT count(*) ${completed} AND p.${achievement.category === 'TUTORIALS' ? 'tutorial_id' : 'challenge_id'} IS NOT NULL) >= ${target}`;
    }
    case 'daily':
      return `(SELECT COALESCE(MAX(total), 0) FROM (SELECT count(*) total ${completed} AND p.challenge_id IS NOT NULL GROUP BY date(p.completed_at / 1000, 'unixepoch'))) >= ${target}`;
    case 'streak':
      // Consecutive UTC calendar dates have a constant day-minus-row-number.
      return `(SELECT COALESCE(MAX(total), 0) FROM (
        SELECT count(*) total FROM (
          SELECT julianday(day) - row_number() OVER (ORDER BY day) AS grp FROM (
            SELECT DISTINCT date(p.completed_at / 1000, 'unixepoch') day ${completed} AND p.challenge_id IS NOT NULL AND p.completed_at IS NOT NULL
          )
        ) GROUP BY grp
      )) >= ${target}`;
    case 'special':
      return achievement.id === 'perfectionist'
        ? `(SELECT count(*) ${completed} AND p.challenge_id IS NOT NULL AND p.attempts = 1) >= ${target}`
        : '0';
  }
}

export function snapshotEligibleAchievements(
  operationId: string,
  userId: string,
) {
  const conditions = ACHIEVEMENTS.map(
    (achievement) => `(a.slug = ? AND (${criterion(achievement)}))`,
  ).join(' OR ');
  return getRuntimeEnv()
    .DB.prepare(
      `
    UPDATE reward_operations SET eligible_achievements = (
      SELECT json_group_array(a.slug) FROM achievements a, users u
      WHERE u.id = ? AND (${conditions})
    ) WHERE id = ? AND first_completion = 1
  `,
    )
    .bind(
      userId,
      ...ACHIEVEMENTS.map((achievement) => achievement.id),
      operationId,
    );
}

export function insertEligibleAchievements(
  operationId: string,
  userId: string,
  now: number,
) {
  const binding = getRuntimeEnv().DB;
  return ACHIEVEMENTS.map((achievement) =>
    binding
      .prepare(
        `
    INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at, progress, award_operation_id)
    SELECT ?, ?, a.id, ?, 100, ? FROM achievements a
    WHERE a.slug = ? AND EXISTS (
      SELECT 1 FROM reward_operations o, json_each(o.eligible_achievements) e
      WHERE o.id = ? AND e.value = a.slug
    )
    ON CONFLICT (user_id, achievement_id) DO NOTHING
  `,
      )
      .bind(
        crypto.randomUUID(),
        userId,
        now,
        operationId,
        achievement.id,
        operationId,
      ),
  );
}

export function addAchievementXp(
  operationId: string,
  userId: string,
  now: number,
) {
  return getRuntimeEnv()
    .DB.prepare(
      `
    UPDATE users SET xp = xp + COALESCE((
      SELECT SUM(a.xp_reward) FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ? AND ua.award_operation_id = ?
    ), 0), updated_at = ? WHERE id = ?
  `,
    )
    .bind(userId, operationId, now, userId);
}
