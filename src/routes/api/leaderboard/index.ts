import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

interface LeaderboardFilters {
  period?: 'all' | 'monthly' | 'weekly';
  page?: number;
  limit?: number;
}

export const Route = createFileRoute('/api/leaderboard/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const filters: LeaderboardFilters = {
            period: url.searchParams.get('period') as LeaderboardFilters['period'] || 'all',
            page: parseInt(url.searchParams.get('page') || '1'),
            limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
          };

          // Build conditions - only show users who opted in to leaderboard
          const conditions = [
            eq(users.showOnLeaderboard, true),
            sql`${users.xp} > 0`, // Only show users with XP
          ];

          // Get total count
          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(and(...conditions));

          const total = countResult[0]?.count || 0;

          // Get leaderboard with pagination
          const offset = ((filters.page || 1) - 1) * (filters.limit || 50);

          const leaderboard = await db
            .select({
              id: users.id,
              name: users.name,
              image: users.image,
              xp: users.xp,
              level: users.level,
              createdAt: users.createdAt,
            })
            .from(users)
            .where(and(...conditions))
            .orderBy(desc(users.xp), desc(users.level))
            .limit(filters.limit || 50)
            .offset(offset);

          // Add rank to each user
          const leaderboardWithRank = leaderboard.map((user, index) => ({
            ...user,
            rank: offset + index + 1,
            displayName: user.name || 'Anonymous',
          }));

          return json({
            success: true,
            data: leaderboardWithRank,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 50,
              total,
              totalPages: Math.ceil(total / (filters.limit || 50)),
            },
          });
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          return json(
            { success: false, error: 'Failed to fetch leaderboard' },
            { status: 500 }
          );
        }
      },
    },
  },
});
