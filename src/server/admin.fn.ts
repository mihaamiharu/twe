import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// ADMIN STATS
// ----------------------------------------------------------------------------

export const getAdminStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { users, submissions, challenges, bugReports } = await import(
        '@/db/schema'
      );
      const { count, desc, sql, gte, lt, and, eq } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      // 1. Total Users
      const userCountResult = await db.select({ value: count() }).from(users);
      const totalUsers = userCountResult[0].value;

      // 2. Total Submissions
      const submissionCountResult = await db
        .select({ value: count() })
        .from(submissions);
      const totalSubmissions = submissionCountResult[0].value;

      // 3. Date ranges for growth calculation
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 4. User Growth
      const currentMonthUsers = await db
        .select({ value: count() })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo));

      const previousMonthUsers = await db
        .select({ value: count() })
        .from(users)
        .where(
          and(
            gte(users.createdAt, sixtyDaysAgo),
            lt(users.createdAt, thirtyDaysAgo),
          ),
        );

      const userGrowthPercent = previousMonthUsers[0].value > 0
        ? ((currentMonthUsers[0].value - previousMonthUsers[0].value) / previousMonthUsers[0].value) * 100
        : currentMonthUsers[0].value > 0 ? 100 : 0;

      // 5. Submission Growth
      const currentMonthSubmissions = await db
        .select({ value: count() })
        .from(submissions)
        .where(gte(submissions.createdAt, thirtyDaysAgo));

      const previousMonthSubmissions = await db
        .select({ value: count() })
        .from(submissions)
        .where(
          and(
            gte(submissions.createdAt, sixtyDaysAgo),
            lt(submissions.createdAt, thirtyDaysAgo),
          ),
        );

      const submissionGrowthPercent = previousMonthSubmissions[0].value > 0
        ? ((currentMonthSubmissions[0].value - previousMonthSubmissions[0].value) / previousMonthSubmissions[0].value) * 100
        : currentMonthSubmissions[0].value > 0 ? 100 : 0;

      // 6. Active Users (last 7 days)
      const activeUsersResult = await db
        .select({ value: count(sql`DISTINCT ${submissions.userId}`) })
        .from(submissions)
        .where(gte(submissions.createdAt, sevenDaysAgo));
      const activeUsers = activeUsersResult[0].value;

      // 7. Submissions by date chart data
      const submissionsByDate = await db
        .select({
          date: sql<string>`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(submissions)
        .where(gte(submissions.createdAt, thirtyDaysAgo))
        .groupBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${submissions.createdAt}, 'YYYY-MM-DD')`);

      // 8. Popular Challenges
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

      // 9. Recent Activity
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

      // 10. User Growth chart data
      const userGrowthData = await db
        .select({
          date: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`,
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`);

      // 11. Submission Success Rate
      const submissionStats = await db
        .select({
          isPassed: submissions.isPassed,
          count: count(),
        })
        .from(submissions)
        .groupBy(submissions.isPassed);

      // 12. Bug Stats
      const bugStatsResults = await db
        .select({
          status: bugReports.status,
          count: count(),
        })
        .from(bugReports)
        .groupBy(bugReports.status);

      // Normalize Bug Stats
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
            passed: submissionStats.find(s => s.isPassed)?.count || 0,
            failed: submissionStats.find(s => !s.isPassed)?.count || 0,
          },
          bugStats
        },
      };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch admin stats:', error);
      return {
        // Return basic structure on error to prevent UI crash
        // ideally we should probably just return success: false and handle it in UI
        success: false,
        error: error.message,
      };
    }
  },
);

// ----------------------------------------------------------------------------
// ADMIN USERS
// ----------------------------------------------------------------------------

export const getAdminUsers = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { users, submissions } = await import('@/db/schema');
      const { desc, eq, count } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          showOnLeaderboard: users.showOnLeaderboard,
          submissionCount: count(submissions.id),
        })
        .from(users)
        .leftJoin(submissions, eq(users.id, submissions.userId))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt));

      return { success: true, data: usersList };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch users:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

const UpdateUserStatusSchema = z.object({
  id: z.string(),
  showOnLeaderboard: z.boolean(),
});

export const updateUserStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateUserStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { users } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      await db
        .update(users)
        .set({
          showOnLeaderboard: input.showOnLeaderboard,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));

      return { success: true, message: 'User updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update user:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

// ----------------------------------------------------------------------------
// ADMIN BUGS
// ----------------------------------------------------------------------------

export const getAdminBugs = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const bugs = await db.query.bugReports.findMany({
        orderBy: (bugReports, { desc }) => [desc(bugReports.createdAt)],
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return { success: true, data: bugs };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch bug reports:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

const UpdateBugStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  adminNotes: z.string().optional(),
});

export const updateBugStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateBugStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { bugReports } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      type BugReportUpdate = {
        status?: typeof input.status;
        adminNotes?: string;
        updatedAt: Date;
      };

      const updateData: BugReportUpdate = {
        updatedAt: new Date(),
      };

      if (input.status) {
        updateData.status = input.status;
      }
      if (input.adminNotes !== undefined) {
        updateData.adminNotes = input.adminNotes;
      }

      await db
        .update(bugReports)
        .set(updateData as typeof bugReports.$inferInsert)
        .where(eq(bugReports.id, input.id));

      return { success: true, message: 'Bug report updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update bug report:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

// ----------------------------------------------------------------------------
// ADMIN CHALLENGES
// ----------------------------------------------------------------------------

export const getAdminChallenges = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { challenges } = await import('@/db/schema');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const list = await db
        .select({
          id: challenges.id,
          slug: challenges.slug,
          title: challenges.title,
          type: challenges.type,
          difficulty: challenges.difficulty,
          xpReward: challenges.xpReward,
          order: challenges.order,
          isPublished: challenges.isPublished,
          tags: challenges.tags,
        })
        .from(challenges)
        .orderBy(challenges.order, challenges.title);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch challenges:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

const UpdateChallengeStatusSchema = z.object({
  id: z.string(),
  isPublished: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
});

export const updateChallengeStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateChallengeStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { challenges } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const existing = await db.query.challenges.findFirst({
        where: eq(challenges.id, input.id),
      });

      if (!existing) {
        return { success: false, error: 'Challenge not found' };
      }

      const updateData: Partial<typeof challenges.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.isPublished !== undefined) {
        updateData.isPublished = input.isPublished;
      }

      if (input.isComingSoon !== undefined) {
        let newTags = existing.tags || [];
        if (input.isComingSoon) {
          if (!newTags.includes('coming-soon')) {
            newTags = [...newTags, 'coming-soon'];
          }
        } else {
          newTags = newTags.filter((t) => t !== 'coming-soon');
        }
        updateData.tags = newTags;
      }

      await db
        .update(challenges)
        .set(updateData)
        .where(eq(challenges.id, input.id));

      return { success: true, message: 'Challenge updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update challenge:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

// ----------------------------------------------------------------------------
// ADMIN SUBMISSIONS
// ----------------------------------------------------------------------------

export const getAdminSubmissions = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const submissionsList = await db.query.submissions.findMany({
        orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
        limit: 100, // For now, list last 100. We can add real pagination later.
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              image: true,
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

      return { success: true, data: submissionsList };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch submissions:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

// ----------------------------------------------------------------------------
// ADMIN TUTORIALS
// ----------------------------------------------------------------------------

export const getAdminTutorials = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { tutorials } = await import('@/db/schema');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const list = await db.select().from(tutorials).orderBy(tutorials.createdAt);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch tutorials:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

const UpdateTutorialStatusSchema = z.object({
  id: z.string(),
  isPublished: z.boolean(),
});

export const updateTutorialStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateTutorialStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { tutorials } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      await db
        .update(tutorials)
        .set({
          isPublished: input.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(tutorials.id, input.id));

      return { success: true, message: 'Tutorial updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update tutorial:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

// ----------------------------------------------------------------------------
// ADMIN ACHIEVEMENTS
// ----------------------------------------------------------------------------

export const getAdminAchievements = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { achievements, userAchievements } = await import('@/db/schema');
      const { count, eq, sql } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const list = await db
        .select({
          id: achievements.id,
          slug: achievements.slug,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          rarity: achievements.rarity,
          category: achievements.category,
          unlockCount: sql<number>`count(${userAchievements.id})::int`,
        })
        .from(achievements)
        .leftJoin(userAchievements, eq(achievements.id, userAchievements.achievementId))
        .groupBy(achievements.id)
        .orderBy(achievements.slug);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch achievements:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },
);

// ----------------------------------------------------------------------------
// ADMIN USER DETAIL
// ----------------------------------------------------------------------------

export const getAdminUserDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data: input }) => {
    try {
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { db } = await import('@/db');
      const { users, submissions, progress } = await import('@/db/schema');
      const { eq, desc } = await import('drizzle-orm');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (
        !session?.user ||
        (session.user as { role?: string }).role !== 'ADMIN'
      ) {
        return { success: false, error: 'Unauthorized' };
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
        with: {
          submissions: {
            orderBy: desc(submissions.createdAt),
            limit: 20,
            with: {
              challenge: {
                columns: {
                  title: true,
                  slug: true,
                }
              }
            }
          }
        }
      });

      if (!user) return { success: false, error: 'User not found' };

      // Get progress counts
      const userProgress = await db
        .select()
        .from(progress)
        .where(eq(progress.userId, input.userId));

      return {
        success: true,
        data: {
          ...user,
          progressCount: userProgress.length
        }
      };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch user detail:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
