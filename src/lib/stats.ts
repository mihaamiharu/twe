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
import { eq, and, sql } from 'drizzle-orm';
import type { UserStats } from './achievements';
import { getRuntimeEnv } from '#platform';
import { addAchievementXp, levelUpdate } from '@/server/reward-sql';
import { getTierFromCategory } from '@/lib/constants';

/**
 * The read/write surface shared by the root database and a Drizzle
 * transaction. Keeping this narrow lets reward evaluation run against the
 * same transaction as the progress mutation.
 */
type StatsDatabase = Pick<typeof db, 'select'>;

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
    .select({ count: sql<number>`count(*)` })
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
    .select({ count: sql<number>`count(*)` })
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
    .select({ count: sql<number>`count(*)` })
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
): Promise<string[]> {
  if (achievementSlugs.length === 0) return [];
  const binding = getRuntimeEnv().DB;
  const operationId = crypto.randomUUID();
  const now = Date.now();
  const statements = [...new Set(achievementSlugs)].map((slug) =>
    binding
      .prepare(
        `
    INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at, progress, award_operation_id)
    SELECT ?, ?, id, ?, 100, ? FROM achievements WHERE slug = ?
    ON CONFLICT (user_id, achievement_id) DO NOTHING
  `,
      )
      .bind(crypto.randomUUID(), userId, now, operationId, slug),
  );
  const results = await binding.batch<Record<string, unknown>>([
    ...statements,
    addAchievementXp(operationId, userId, now),
    levelUpdate(userId),
    binding
      .prepare(
        `SELECT a.slug FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = ? AND ua.award_operation_id = ?`,
      )
      .bind(userId, operationId),
  ]);
  return (results.at(-1)?.results ?? []).flatMap((row) =>
    typeof row['slug'] === 'string' ? [row['slug']] : [],
  );
}
