import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { users, progress, achievements, userAchievements, submissions } from '@/db/schema';
import { logger } from '@/lib/logger';
import { desc, eq, and, sql, inArray, like } from 'drizzle-orm';
import { z } from 'zod';

const LeaderboardFilterSchema = z.object({
  page: z.number().default(1),
  limit: z.number().max(100).default(50),
  period: z.enum(['all', 'monthly', 'weekly']).default('all'),
  locale: z.string().default('en'),
});

export const getLeaderboard = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => LeaderboardFilterSchema.parse(data))
  .handler(async ({ data: filters }) => {
    try {
      // Build conditions - only show users who opted in to leaderboard and have XP
      const conditions = [
        eq(users.showOnLeaderboard, true),
        sql`${users.xp} > 0`,
      ];

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(...conditions));

      const total = countResult?.count || 0;

      // Get leaderboard with pagination
      const offset = (filters.page - 1) * filters.limit;

      // Calculate start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Subquery for monthly XP from submissions
      const monthlySubmissionsXp = sql<number>`(
        SELECT COALESCE(SUM(${submissions.xpEarned}), 0)
        FROM ${submissions}
        WHERE ${submissions.userId} = ${users.id}
        AND ${submissions.createdAt} >= ${startOfMonth.toISOString()}
      )`;

      // Subquery for monthly XP from achievements
      const monthlyAchievementsXp = sql<number>`(
        SELECT COALESCE(SUM(${achievements.xpReward}), 0)
        FROM ${userAchievements}
        INNER JOIN ${achievements} ON ${userAchievements.achievementId} = ${achievements.id}
        WHERE ${userAchievements.userId} = ${users.id}
        AND ${userAchievements.unlockedAt} >= ${startOfMonth.toISOString()}
      )`;

      // Define the score column based on period
      const scoreColumn = filters.period === 'monthly'
        ? sql<number>`(${monthlySubmissionsXp} + ${monthlyAchievementsXp})`
        : users.xp;

      const leaderboard = await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
          xp: users.xp, // Global XP
          monthlyXp: sql<number>`(${monthlySubmissionsXp} + ${monthlyAchievementsXp})::int`, // Expose monthly XP
          level: users.level,
          createdAt: users.createdAt,
          challengesCompleted: sql<number>`(
            SELECT count(*)::int
            FROM ${progress}
            WHERE ${progress.userId} = ${users.id}
            AND ${progress.isCompleted} = true
            AND ${progress.challengeId} IS NOT NULL
          )`,
        })
        .from(users)
        .where(
          and(
            ...conditions,
            // If monthly, ensure they have some monthly XP
            filters.period === 'monthly'
              ? sql`(${monthlySubmissionsXp} + ${monthlyAchievementsXp}) > 0`
              : undefined
          )
        )
        .orderBy(desc(scoreColumn), desc(users.level))
        .limit(filters.limit)
        .offset(offset);

      // Fetch Boss achievements for these users
      const userIds = leaderboard.map((u) => u.id);
      const userBadgesMap = new Map<
        string,
        Array<{ name: string; icon: string; slug: string }>
      >();

      if (userIds.length > 0) {
        const badges = await db
          .select({
            userId: userAchievements.userId,
            name: sql<string>`COALESCE(${achievements.name}->>${filters.locale}, ${achievements.name}->>'en', '')`,
            icon: achievements.icon,
            slug: achievements.slug,
          })
          .from(userAchievements)
          .innerJoin(
            achievements,
            eq(userAchievements.achievementId, achievements.id),
          )
          .where(
            and(
              inArray(userAchievements.userId, userIds),
              // Filter for Boss achievements (assuming slugs contain 'boss')
              like(achievements.slug, '%boss%'),
            ),
          );

        badges.forEach((badge) => {
          if (!userBadgesMap.has(badge.userId)) {
            userBadgesMap.set(badge.userId, []);
          }
          userBadgesMap.get(badge.userId)?.push(badge);
        });
      }

      // Add rank and badges to each user
      const leaderboardWithRank = leaderboard.map((user, index) => ({
        ...user,
        rank: offset + index + 1,
        displayName: user.name || 'Anonymous',
        badges: userBadgesMap.get(user.id) || [],
      }));

      return {
        success: true,
        data: leaderboardWithRank,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      return {
        success: false,
        error: 'An error occurred while loading the leaderboard.',
      };
    }
  });
