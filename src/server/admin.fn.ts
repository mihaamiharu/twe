import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// ADMIN STATS
// ----------------------------------------------------------------------------

export const getAdminStats = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { users, submissions, challenges } = await import('@/db/schema');
            const { count, desc, sql, gte } = await import('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
                return { success: false, error: 'Unauthorized' };
            }

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

            return {
                success: true,
                data: {
                    totalUsers,
                    totalSubmissions,
                    submissionsByDate,
                    popularChallenges,
                    recentActivity
                }
            };
        } catch (ignored) {
            const error = ignored as Error;
            console.error('Failed to fetch admin stats:', error);
            return {
                users: 0,
                active: 0,
                submissions: 0,
                completions: 0,
                error: error.message
            };
        }
    });


// ----------------------------------------------------------------------------
// ADMIN USERS
// ----------------------------------------------------------------------------

export const getAdminUsers = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { users, submissions } = await import('@/db/schema');
            const { desc, eq, count } = await import('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
                return { success: false, error: 'Unauthorized' };
            }

            const usersList = await db.select({
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
    });

const UpdateUserStatusSchema = z.object({
    id: z.string(),
    showOnLeaderboard: z.boolean(),
});

export const updateUserStatus = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateUserStatusSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { users } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
                return { success: false, error: 'Unauthorized' };
            }

            await db.update(users)
                .set({
                    showOnLeaderboard: input.showOnLeaderboard,
                    updatedAt: new Date()
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

export const getAdminBugs = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
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
    });

const UpdateBugStatusSchema = z.object({
    id: z.string(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    adminNotes: z.string().optional(),
});

export const updateBugStatus = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateBugStatusSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { bugReports } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
                return { success: false, error: 'Unauthorized' };
            }

            type BugReportUpdate = {
                status?: typeof input.status;
                adminNotes?: string;
                updatedAt: Date;
            };

            const updateData: BugReportUpdate = {
                updatedAt: new Date()
            };

            if (input.status) {
                updateData.status = input.status;
            }
            if (input.adminNotes !== undefined) {
                updateData.adminNotes = input.adminNotes;
            }

            await db.update(bugReports)
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

export const getAdminChallenges = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { challenges } = await import('@/db/schema');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
                return { success: false, error: 'Unauthorized' };
            }

            const list = await db.select({
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
    });

const UpdateChallengeStatusSchema = z.object({
    id: z.string(),
    isPublished: z.boolean().optional(),
    isComingSoon: z.boolean().optional(),
});

export const updateChallengeStatus = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateChallengeStatusSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { challenges } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
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
                    newTags = newTags.filter(t => t !== 'coming-soon');
                }
                updateData.tags = newTags;
            }

            await db.update(challenges)
                .set(updateData)
                .where(eq(challenges.id, input.id));

            return { success: true, message: 'Challenge updated' };
        } catch (ignored) {
            const error = ignored as Error;
            console.error('Failed to update challenge:', error);
            return { success: false, error: 'Internal Server Error' };
        }
    });
