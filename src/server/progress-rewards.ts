import { getRuntimeEnv } from '#platform';
import { z } from 'zod';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { checkLevelUp } from '@/lib/gamification';
import {
  addAchievementXp,
  insertEligibleAchievements,
  levelUpdate,
  snapshotEligibleAchievements,
} from './reward-sql';

export type ProgressRewardTarget =
  | { kind: 'tutorial'; tutorialId: string; xpReward: number }
  | { kind: 'challenge'; challengeId: string; xpReward: number };

export interface SubmissionWrite {
  code: string;
  isPassed: boolean;
  executionTime?: number | undefined;
  testsPassed: number;
  testsTotal: number;
  errorMessage?: string | undefined;
}

const resultSchema = z.object({
  progressId: z.string(),
  wasCompleted: z.number(),
  firstCompletion: z.number(),
  usedHint: z.number(),
  xpAwarded: z.number(),
  oldXp: z.number(),
  newXp: z.number(),
});
const achievementSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
});

/**
 * D1 executes the entire prepared batch serially in one transaction. Every
 * read-dependent decision remains inside SQL; no interactive transaction,
 * JS read/modify/write XP update, or SELECT FOR UPDATE is used.
 */
export async function runProgressRewardTransaction({
  userId,
  target,
  shouldComplete,
  submission,
  locale = 'en',
}: {
  userId: string;
  target: ProgressRewardTarget;
  shouldComplete: boolean;
  submission?: SubmissionWrite;
  locale?: string;
}) {
  if ((target.kind === 'challenge') !== Boolean(submission))
    throw new Error('Challenge rewards require a submission.');
  const binding = getRuntimeEnv().DB;
  const now = Date.now();
  const operationId = crypto.randomUUID();
  const submissionId = submission ? crypto.randomUUID() : null;
  const targetColumn =
    target.kind === 'tutorial' ? 'tutorial_id' : 'challenge_id';
  const targetId =
    target.kind === 'tutorial' ? target.tutorialId : target.challengeId;
  const statements = [
    binding
      .prepare(
        `INSERT INTO progress (id, user_id, ${targetColumn}, is_completed, attempts, used_hint, created_at, updated_at, last_accessed_at) VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?) ON CONFLICT DO NOTHING`,
      )
      .bind(crypto.randomUUID(), userId, targetId, now, now, now),
    binding
      .prepare(
        `
      INSERT INTO reward_operations (id, user_id, kind, target_id, progress_id, was_completed, first_completion, used_hint, xp_awarded, old_xp, created_at)
      SELECT ?, ?, ?, ?, p.id, p.is_completed, (? AND p.is_completed = 0), p.used_hint,
        CASE WHEN ? AND p.is_completed = 0 THEN CAST(? * CASE WHEN ? = 'challenge' AND p.used_hint = 1 THEN 0.5 ELSE 1 END AS INTEGER) ELSE 0 END,
        u.xp, ? FROM progress p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? AND p.${targetColumn} = ?
    `,
      )
      .bind(
        operationId,
        userId,
        target.kind,
        targetId,
        Number(shouldComplete),
        Number(shouldComplete),
        target.xpReward,
        target.kind,
        now,
        userId,
        targetId,
      ),
  ];
  if (submission)
    statements.push(
      binding
        .prepare(
          `
    INSERT INTO submissions (id, user_id, challenge_id, code, is_passed, xp_earned, execution_time, tests_passed, tests_total, error_message, created_at)
    SELECT ?, ?, ?, ?, ?, o.xp_awarded, ?, ?, ?, ?, ? FROM reward_operations o WHERE o.id = ?
  `,
        )
        .bind(
          submissionId,
          userId,
          targetId,
          submission.code,
          Number(submission.isPassed),
          submission.executionTime ?? null,
          submission.testsPassed,
          submission.testsTotal,
          submission.errorMessage ?? null,
          now,
          operationId,
        ),
    );
  statements.push(
    binding
      .prepare(
        `
      UPDATE progress SET is_completed = (is_completed OR ?),
        completed_at = CASE WHEN (SELECT first_completion FROM reward_operations WHERE id = ?) THEN ? ELSE completed_at END,
        last_accessed_at = ?, updated_at = ?, attempts = COALESCE(attempts, 0) + ?,
        best_submission_id = CASE WHEN ? THEN ? ELSE best_submission_id END
      WHERE id = (SELECT progress_id FROM reward_operations WHERE id = ?)
        AND (? = 'challenge' OR is_completed = 0)
    `,
      )
      .bind(
        Number(shouldComplete),
        operationId,
        now,
        now,
        now,
        target.kind === 'challenge' ? 1 : 0,
        Number(Boolean(submission?.isPassed)),
        submissionId,
        operationId,
        target.kind,
      ),
    binding
      .prepare(
        'UPDATE users SET xp = xp + (SELECT xp_awarded FROM reward_operations WHERE id = ?), updated_at = ? WHERE id = ?',
      )
      .bind(operationId, now, userId),
    binding
      .prepare(
        target.kind === 'tutorial'
          ? 'UPDATE tutorials SET view_count = view_count + 1 WHERE id = ? AND (SELECT first_completion FROM reward_operations WHERE id = ?) = 1'
          : 'UPDATE challenges SET completion_count = completion_count + 1 WHERE id = ? AND (SELECT first_completion FROM reward_operations WHERE id = ?) = 1',
      )
      .bind(targetId, operationId),
    levelUpdate(userId),
    snapshotEligibleAchievements(operationId, userId),
    ...insertEligibleAchievements(operationId, userId, now),
    addAchievementXp(operationId, userId, now),
    levelUpdate(userId),
    binding
      .prepare(
        `SELECT o.progress_id progressId, o.was_completed wasCompleted, o.first_completion firstCompletion, o.used_hint usedHint, o.xp_awarded xpAwarded, o.old_xp oldXp, u.xp newXp FROM reward_operations o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      )
      .bind(operationId),
    binding
      .prepare(
        `SELECT a.id, a.slug, COALESCE(a.name ->> ?, a.name ->> 'en', '') name, a.icon FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.award_operation_id = ? AND ua.user_id = ?`,
      )
      .bind(locale, operationId, userId),
  );
  const results = await binding.batch(statements);
  const result = resultSchema.parse(results.at(-2)?.results[0]);
  const newAchievements = achievementSchema
    .array()
    .parse(results.at(-1)?.results);
  const level = checkLevelUp(result.oldXp, result.newXp - result.oldXp);
  const awardedAchievementSlugs = newAchievements.map((item) => item.slug);
  return {
    progressId: result.progressId,
    wasAlreadyCompleted: Boolean(result.wasCompleted),
    isFirstCompletion: Boolean(result.firstCompletion),
    usedHint: Boolean(result.usedHint),
    xpAwarded: result.xpAwarded,
    levelUp: level.leveledUp
      ? {
          oldLevel: level.oldLevel,
          newLevel: level.newLevel,
          levelsGained: level.levelsGained,
        }
      : null,
    earnedAchievements: ACHIEVEMENTS.filter((item) =>
      awardedAchievementSlugs.includes(item.id),
    ),
    awardedAchievementSlugs,
    persisted: {
      submission: {
        id: submissionId ?? '',
        isPassed: submission?.isPassed ?? false,
        testsPassed: submission?.testsPassed ?? 0,
        testsTotal: submission?.testsTotal ?? 0,
        xpEarned: result.xpAwarded,
        executionTime: submission?.executionTime,
      },
      newAchievements: newAchievements.map(({ id, name, icon }) => ({
        id,
        name,
        icon,
      })),
    },
  };
}
