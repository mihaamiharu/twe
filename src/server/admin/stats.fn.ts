import { createServerFn } from '@tanstack/react-start';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import {
  users,
  submissions,
  challenges,
  bugReports,
} from '@/db/schema';
import { count, desc, sql, gte, lt, and } from 'drizzle-orm';

export const getAdminStats = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        userCountResult,
        submissionCountResult,
        currentMonthUsers,
        previousMonthUsers,
        currentMonthSubmissions,
        previousMonthSubmissions,
        activeUsersResult,
        submissionsByDate,
        popularChallenges,
        recentActivity,
        userGrowthData,
        submissionStats,
        bugStatsResults,
      ] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(submissions),
        db
          .select({ value: count() })
          .from(users)
          .where(gte(users.createdAt, thirtyDaysAgo)),
        db
          .select({ value: count() })
          .from(users)
          .where(
            and(
              gte(users.createdAt, sixtyDaysAgo),
              lt(users.createdAt, thirtyDaysAgo),
            ),
          ),
        db
          .select({ value: count() })
          .from(submissions)
          .where(gte(submissions.createdAt, thirtyDaysAgo)),
        db
          .select({ value: count() })
          .from(submissions)
          .where(
            and(
              gte(submissions.createdAt, sixtyDaysAgo),
              lt(submissions.createdAt, thirtyDaysAgo),
            ),
          ),
        db
          .select({ value: count(sql`DISTINCT ${submissions.userId}`) })
          .from(submissions)
          .where(gte(submissions.createdAt, sevenDaysAgo)),
        db
          .select({
            date: sql<string>`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`,
            count: count(),
          })
          .from(submissions)
          .where(gte(submissions.createdAt, thirtyDaysAgo))
          .groupBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`),
        db
          .select({
            id: challenges.id,
            slug: challenges.slug,
            title: challenges.title,
            completionCount: challenges.completionCount,
            difficulty: challenges.difficulty,
          })
          .from(challenges)
          .orderBy(desc(challenges.completionCount))
          .limit(5),
        db.query.submissions.findMany({
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
        }),
        db
          .select({
            date: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`,
            count: count(),
          })
          .from(users)
          .where(gte(users.createdAt, thirtyDaysAgo))
          .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`),
        db
          .select({
            isPassed: submissions.isPassed,
            count: count(),
          })
          .from(submissions)
          .groupBy(submissions.isPassed),
        db
          .select({
            status: bugReports.status,
            count: count(),
          })
          .from(bugReports)
          .groupBy(bugReports.status),
      ]);

      const totalUsers = userCountResult[0].value;
      const totalSubmissions = submissionCountResult[0].value;

      const userGrowthPercent =
        previousMonthUsers[0].value > 0
          ? ((currentMonthUsers[0].value - previousMonthUsers[0].value) /
            previousMonthUsers[0].value) *
          100
          : currentMonthUsers[0].value > 0
            ? 100
            : 0;

      const submissionGrowthPercent =
        previousMonthSubmissions[0].value > 0
          ? ((currentMonthSubmissions[0].value -
            previousMonthSubmissions[0].value) /
            previousMonthSubmissions[0].value) *
          100
          : currentMonthSubmissions[0].value > 0
            ? 100
            : 0;

      const activeUsers = activeUsersResult[0].value;

      const bugStats = {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
        NEW: 0,
        WONT_FIX: 0,
      };

      bugStatsResults.forEach((stat) => {
        if (stat.status) {
          // @ts-expect-error - dynamic assignment
          bugStats[stat.status] = stat.count;
        }
      });

      return {
        success: true,
        data: {
          totalUsers,
          totalSubmissions,
          activeUsers,
          userGrowthPercent,
          submissionGrowthPercent,
          submissionsByDate,
          popularChallenges,
          recentActivity,
          userGrowth: userGrowthData,
          submissionStats: {
            passed: submissionStats.find((s) => s.isPassed)?.count || 0,
            failed: submissionStats.find((s) => !s.isPassed)?.count || 0,
          },
          bugStats,
        },
      };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch admin stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });
