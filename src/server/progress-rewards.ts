import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { progress, users } from '@/db/schema';
import type { Achievement } from '@/lib/achievements';
import { checkAchievements } from '@/lib/achievements';
import { checkLevelUp } from '@/lib/gamification';
import {
  awardAchievements,
  getEarnedAchievementIds,
  getUserStats,
} from '@/lib/stats';

/** The transaction type accepted by callbacks that add domain-specific writes. */
export type ProgressTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type ProgressRewardTarget =
  | {
      kind: 'tutorial';
      tutorialId: string;
      xpReward: number;
    }
  | {
      kind: 'challenge';
      challengeId: string;
      xpReward: number;
    };

export type ProgressRewardCompletion = {
  progressId: string;
  wasAlreadyCompleted: boolean;
  isFirstCompletion: boolean;
  usedHint: boolean;
  xpAwarded: number;
  levelUp: {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
  } | null;
  earnedAchievements: Achievement[];
  awardedAchievementSlugs: string[];
};

type ProgressRewardCallback<T> = (
  transaction: ProgressTransaction,
  completion: ProgressRewardCompletion,
) => Promise<T>;

type RunProgressRewardInput<T> = {
  userId: string;
  target: ProgressRewardTarget;
  shouldComplete: boolean;
  onPersist: ProgressRewardCallback<T>;
};

/**
 * Runs the shared progress transition and reward ledger in one transaction.
 * Tutorial view counts and challenge submissions/counters remain callbacks so
 * their domain-specific persistence stays explicit at the call site.
 */
export async function runProgressRewardTransaction<T>({
  userId,
  target,
  shouldComplete,
  onPersist,
}: RunProgressRewardInput<T>): Promise<
  ProgressRewardCompletion & { persisted: T }
> {
  return db.transaction(async (transaction) => {
    const entityValues =
      target.kind === 'tutorial'
        ? {
            tutorialId: target.tutorialId,
            isCompleted: false,
            readingProgress: 0,
          }
        : {
            challengeId: target.challengeId,
            isCompleted: false,
            attempts: 0,
          };

    await transaction
      .insert(progress)
      .values({ userId, ...entityValues })
      .onConflictDoNothing();

    const entityCondition =
      target.kind === 'tutorial'
        ? eq(progress.tutorialId, target.tutorialId)
        : eq(progress.challengeId, target.challengeId);
    const [progressRecord] = await transaction
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), entityCondition))
      .for('update');

    if (!progressRecord) {
      throw new Error('Failed to initialize progress');
    }

    const wasAlreadyCompleted = progressRecord.isCompleted;
    const isFirstCompletion = shouldComplete && !wasAlreadyCompleted;
    const usedHint = progressRecord.usedHint;
    const xpAwarded = isFirstCompletion
      ? Math.floor(
          target.xpReward * (target.kind === 'challenge' && usedHint ? 0.5 : 1),
        )
      : 0;
    const now = new Date();
    let initialXp: number | null = null;

    if (target.kind === 'tutorial' ? !wasAlreadyCompleted : true) {
      await transaction
        .update(progress)
        .set({
          isCompleted: progressRecord.isCompleted || shouldComplete,
          completedAt: isFirstCompletion ? now : progressRecord.completedAt,
          lastAccessedAt: now,
          updatedAt: now,
          ...(target.kind === 'tutorial'
            ? {
                readingProgress: isFirstCompletion
                  ? 100
                  : progressRecord.readingProgress,
              }
            : {
                attempts: (progressRecord.attempts ?? 0) + 1,
              }),
        })
        .where(eq(progress.id, progressRecord.id));
    }

    if (isFirstCompletion) {
      const [user] = await transaction
        .select({ xp: users.xp, level: users.level })
        .from(users)
        .where(eq(users.id, userId))
        .for('update');
      if (!user) throw new Error('User not found');

      initialXp = user.xp;
      const levelUpInfo = checkLevelUp(user.xp, xpAwarded);
      await transaction
        .update(users)
        .set({
          xp: user.xp + xpAwarded,
          level: levelUpInfo.newLevel,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
    }

    const earnedAchievements = isFirstCompletion
      ? checkAchievements(
          await getUserStats(userId, transaction),
          await getEarnedAchievementIds(userId, transaction),
        )
      : [];
    const awardedAchievementSlugs = await awardAchievements(
      userId,
      earnedAchievements.map((achievement) => achievement.id),
      transaction,
    );

    let levelUp: ProgressRewardCompletion['levelUp'] = null;
    if (initialXp !== null) {
      const [updatedUser] = await transaction
        .select({ xp: users.xp })
        .from(users)
        .where(eq(users.id, userId));
      if (updatedUser) {
        const levelUpInfo = checkLevelUp(initialXp, updatedUser.xp - initialXp);
        if (levelUpInfo.leveledUp) {
          levelUp = {
            oldLevel: levelUpInfo.oldLevel,
            newLevel: levelUpInfo.newLevel,
            levelsGained: levelUpInfo.levelsGained,
          };
        }
      }
    }

    const completion: ProgressRewardCompletion = {
      progressId: progressRecord.id,
      wasAlreadyCompleted,
      isFirstCompletion,
      usedHint,
      xpAwarded,
      levelUp,
      earnedAchievements,
      awardedAchievementSlugs,
    };

    return {
      ...completion,
      persisted: await onPersist(transaction, completion),
    };
  });
}
