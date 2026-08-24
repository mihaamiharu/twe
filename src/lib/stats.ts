/**
 * User Statistics Helper
 *
 * Aggregates user statistics from the database for achievement checking.
 */

import { db } from '@/db';
import {
  progress,
  users,
  challenges,
  userAchievements,
  achievements,
  bugReports,
} from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { UserStats } from './achievements';
import { logger } from '@/lib/logger';
import { getTierFromCategory } from '@/lib/constants';
import { checkLevelUp } from '@/lib/gamification';

/**
 * The read/write surface shared by the root database and a Drizzle
 * transaction. Keeping this narrow lets reward evaluation run against the
 * same transaction as the progress mutation.
 */
type StatsDatabase = Pick<typeof db, 'select'>;
type AchievementDatabase = Pick<typeof db, 'select' | 'insert' | 'update'>;

/**
 * Get user stats for achievement checking
 */
export async function getUserStats(
  userId: string,
  database: StatsDatabase = db,
): Promise<UserStats> {
  // Get user
  const [user] = await database
    .select({ xp: users.xp, level: users.level })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error('User not found');
  }

  // Get completed challenges with their types
  const completedChallenges = await database
    .select({
      challengeId: progress.challengeId,
      type: challenges.type,
      category: challenges.category,
      completedAt: progress.completedAt,
    })
    .from(progress)
    .innerJoin(challenges, eq(progress.challengeId, challenges.id))
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.isCompleted, true),
        sql`${progress.challengeId} IS NOT NULL`,
      ),
    );

  // Count challenges by type
  const challengesByType: Record<string, number> = {};
  const challengesByTier: Record<string, number> = {};

  for (const c of completedChallenges) {
    if (c.type) {
      challengesByType[c.type] = (challengesByType[c.type] || 0) + 1;
    }
    const tier = getTierFromCategory(c.category || undefined);
    challengesByTier[tier] = (challengesByTier[tier] || 0) + 1;
  }

  // Get completed tutorials count
  const tutorialsResult = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.isCompleted, true),
        sql`${progress.tutorialId} IS NOT NULL`,
      ),
    );

  const tutorialsCompleted = tutorialsResult[0]?.count || 0;

  // Calculate streak and max daily challenges
  const completionDates = completedChallenges
    .map((c) => c.completedAt)
    .filter(Boolean) as Date[];
  const { currentStreak, longestStreak } = calculateStreak(completionDates);
  const maxDailyChallenges = calculateMaxDailyChallenges(completionDates);

  // Count perfect scores (all tests passed on first try - we approximate by checking if attempts = 1)
  const perfectScoresResult = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.isCompleted, true),
        eq(progress.attempts, 1),
        sql`${progress.challengeId} IS NOT NULL`,
      ),
    );

  const perfectScores = perfectScoresResult[0]?.count || 0;

  // Count bug reports
  const bugReportsResult = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(bugReports)
    .where(eq(bugReports.userId, userId));

  const bugReportsFiled = bugReportsResult[0]?.count || 0;

  return {
    totalChallengesCompleted: completedChallenges.length,
    challengesByType,
    totalXP: user.xp,
    level: user.level,
    currentStreak,
    longestStreak,
    tutorialsCompleted,
    perfectScores,
    bugReportsFiled,
    challengesByTier,
    maxDailyChallenges,
  };
}

/**
 * Calculate current and longest streak from completion dates
 */
export function calculateStreak(completionDates: Date[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...completionDates].sort(
    (a, b) => b.getTime() - a.getTime(),
  );

  // Remove duplicates (same day)
  const uniqueDays = new Set<string>();
  const dayDates: Date[] = [];

  for (const date of sortedDates) {
    const dayKey = date.toISOString().slice(0, 10);
    if (!uniqueDays.has(dayKey)) {
      uniqueDays.add(dayKey);
      dayDates.push(date);
    }
  }

  // Calculate current streak (starting from today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let longestStreak = 1;
  let tempStreak = 1;

  const firstDayValue = dayDates[0];
  if (!firstDayValue) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  const firstDay = new Date(firstDayValue);
  firstDay.setHours(0, 0, 0, 0);

  // Check if the most recent activity is today or yesterday
  const isActiveStreak =
    firstDay.getTime() === today.getTime() ||
    firstDay.getTime() === yesterday.getTime();

  if (isActiveStreak) {
    currentStreak = 1;
  }

  // Calculate streaks
  for (let i = 1; i < dayDates.length; i++) {
    const previousDate = dayDates[i - 1];
    const currentDate = dayDates[i];
    if (!previousDate || !currentDate) continue;
    const prevDay = new Date(previousDate);
    const currDay = new Date(currentDate);
    prevDay.setHours(0, 0, 0, 0);
    currDay.setHours(0, 0, 0, 0);

    // Check if consecutive days
    const diffDays =
      (prevDay.getTime() - currDay.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak++;
      if (isActiveStreak && i < dayDates.length) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Calculate the maximum number of challenges completed in a single day
 */
function calculateMaxDailyChallenges(completionDates: Date[]): number {
  if (completionDates.length === 0) {
    return 0;
  }

  const countByDay = new Map<string, number>();
  for (const date of completionDates) {
    const dayKey = date.toISOString().slice(0, 10); // "2026-01-16"
    countByDay.set(dayKey, (countByDay.get(dayKey) ?? 0) + 1);
  }

  return Math.max(0, ...countByDay.values());
}

/**
 * Get already earned achievement slugs for a user
 * Returns slugs (strings) instead of UUIDs to match static definition logic
 */
export async function getEarnedAchievementIds(
  userId: string,
  database: StatsDatabase = db,
): Promise<Set<string>> {
  const earned = await database
    .select({ slug: achievements.slug })
    .from(userAchievements)
    .innerJoin(
      achievements,
      eq(userAchievements.achievementId, achievements.id),
    )
    .where(eq(userAchievements.userId, userId));

  return new Set(earned.map((e) => e.slug));
}

/**
 * Award achievements to a user
 * 1. Resolves slugs to DB UUIDs
 * 2. Inserts into user_achievements
 * 3. Updates user XP
 */
export async function awardAchievements(
  userId: string,
  achievementSlugs: string[],
  database: AchievementDatabase = db,
): Promise<string[]> {
  if (achievementSlugs.length === 0) return [];

  if (database === db) {
    return db.transaction((transaction) =>
      awardAchievementsInTransaction(userId, achievementSlugs, transaction),
    );
  }

  return awardAchievementsInTransaction(userId, achievementSlugs, database);
}

async function awardAchievementsInTransaction(
  userId: string,
  achievementSlugs: string[],
  database: AchievementDatabase,
): Promise<string[]> {
  if (achievementSlugs.length === 0) return [];

  // Resolve reward values from the database rather than from request data.
  const dbAchievements = await database
    .select({
      id: achievements.id,
      slug: achievements.slug,
      xpReward: achievements.xpReward,
    })
    .from(achievements)
    .where(inArray(achievements.slug, achievementSlugs));

  if (dbAchievements.length === 0) return [];

  // 2. Insert into user_achievements
  const values = dbAchievements.map((a) => ({
    userId,
    achievementId: a.id,
    unlockedAt: new Date(),
    progress: 100,
  }));

  const insertedAchievements = await database
    .insert(userAchievements)
    .values(values)
    .onConflictDoNothing({
      target: [userAchievements.userId, userAchievements.achievementId],
    })
    .returning({ achievementId: userAchievements.achievementId });

  if (insertedAchievements.length === 0) return [];

  // Only rows inserted by this request may produce XP. A concurrent retry
  // can therefore never re-award an already unlocked achievement.
  const insertedIds = new Set(
    insertedAchievements.map((achievement) => achievement.achievementId),
  );
  const awardedAchievements = dbAchievements.filter((achievement) =>
    insertedIds.has(achievement.id),
  );
  const totalXpReward = awardedAchievements.reduce(
    (sum, achievement) => sum + achievement.xpReward,
    0,
  );

  if (totalXpReward > 0) {
    // Serialize all XP writes for one user so both the total and derived
    // level are computed from the same authoritative value.
    const [user] = await database
      .select({ xp: users.xp, level: users.level })
      .from(users)
      .where(eq(users.id, userId))
      .for('update');

    if (user) {
      // Calculate new level using the gamification helper
      const levelUpInfo = checkLevelUp(user.xp, totalXpReward);

      await database
        .update(users)
        .set({
          xp: user.xp + totalXpReward,
          level: levelUpInfo.newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      if (levelUpInfo.leveledUp) {
        logger.info(
          `[Achievements] User ${userId} leveled up! ${levelUpInfo.oldLevel} -> ${levelUpInfo.newLevel}`,
        );
      }

      logger.info(
        `[Achievements] Awarded ${totalXpReward} XP to user ${userId}`,
      );
    }
  }

  const slugById = new Map(
    dbAchievements.map((achievement) => [achievement.id, achievement.slug]),
  );
  return insertedAchievements.flatMap((achievement) => {
    const slug = slugById.get(achievement.achievementId);
    return slug ? [slug] : [];
  });
}
