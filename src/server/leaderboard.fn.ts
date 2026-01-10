import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { users, progress, achievements, userAchievements } from '@/db/schema';
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

      const leaderboard = await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
          xp: users.xp,
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
        .where(and(...conditions))
        .orderBy(desc(users.xp), desc(users.level))
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
        error: error instanceof Error ? error.message : String(error), // Return actual error for debugging
      };
    }
  });
