import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users, submissions, challenges } from '@/db/schema';
import { auth } from '@/lib/auth.server';
import { count, desc, eq, sql, and, gte } from 'drizzle-orm';

export const Route = createFileRoute('/api/admin/stats')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user || (session.user as any).role !== 'ADMIN') {
          return json(
            { success: false, error: 'Unauthorized' },
            { status: 403 }
          );
        }

        try {
          // 1. Total Users
          const userCountResult = await db.select({ value: count() }).from(users);
          const totalUsers = userCountResult[0].value;

          // 2. Total Submissions
          const submissionCountResult = await db.select({ value: count() }).from(submissions);
          const totalSubmissions = submissionCountResult[0].value;

          // 3. Submissions last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const submissionsByDate = await db
            .select({
              date: sql<string>`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`,
              count: count(),
            })
            .from(submissions)
            .where(gte(submissions.createdAt, thirtyDaysAgo))
            .groupBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`);

          // 4. Popular Challenges
          const popularChallenges = await db
            .select({
              id: challenges.id,
              slug: challenges.slug,
              title: challenges.title,
              completionCount: challenges.completionCount,
              difficulty: challenges.difficulty,
            })
            .from(challenges)
            .orderBy(desc(challenges.completionCount))
            .limit(5);

          // 5. Recent Activity
          const recentActivity = await db.query.submissions.findMany({
            orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
            limit: 5,
            with: {
              user: {
                columns: {
                  name: true,
                  image: true,
                  email: true,
                },
              },
              challenge: {
                columns: {
                  title: true,
                  slug: true,
                },
              },
            },
          });

          return json({
            success: true,
            data: {
              totalUsers,
              totalSubmissions,
              submissionsByDate,
              popularChallenges,
              recentActivity
            }
          });
        } catch (error) {
          console.error('Failed to fetch admin stats:', error);
          return json(
            { success: false, error: 'Failed to fetch admin stats' },
            { status: 500 }
          );
        }
      },
    },
  },
});
