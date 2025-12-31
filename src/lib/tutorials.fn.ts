import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
// Imports moved inside handler to avoid client-side bundling issues

// ----------------------------------------------------------------------------
// GET TUTORIALS (LIST)
// ----------------------------------------------------------------------------

const TutorialFiltersSchema = z.object({
    search: z.string().optional(),
    tag: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().max(50).default(20),
    sortBy: z.enum(['order', 'estimatedMinutes', 'viewCount', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getTutorials = createServerFn({ method: 'GET' })
    .inputValidator((data: unknown) => TutorialFiltersSchema.parse(data))
    .handler(async ({ data: filters }) => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { tutorials, progress } = await import('@/db/schema');
            const { eq, and, asc, desc, sql, or } = await import('drizzle-orm');

            // Build conditions
            const conditions = [eq(tutorials.isPublished, true)];

            if (filters.search) {
                const searchCondition = or(
                    sql`${tutorials.title} ILIKE ${`%${filters.search}%`}`,
                    sql`${tutorials.description} ILIKE ${`%${filters.search}%`}`
                );
                if (searchCondition) {
                    conditions.push(searchCondition);
                }
            }

            if (filters.tag) {
                conditions.push(sql`${filters.tag} = ANY(${tutorials.tags})`);
            }

            // Get total count
            const [countResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tutorials)
                .where(and(...conditions));

            const total = countResult?.count || 0;

            // Determine sort
            const sortColumn = {
                order: tutorials.order,
                estimatedMinutes: tutorials.estimatedMinutes,
                viewCount: tutorials.viewCount,
                createdAt: tutorials.createdAt,
            }[filters.sortBy];

            const orderFn = filters.sortOrder === 'desc' ? desc : asc;

            // Pagination
            const offset = (filters.page - 1) * filters.limit;

            const tutorialList = await db
                .select({
                    id: tutorials.id,
                    slug: tutorials.slug,
                    title: tutorials.title,
                    description: tutorials.description,
                    estimatedMinutes: tutorials.estimatedMinutes,
                    tags: tutorials.tags,
                    viewCount: tutorials.viewCount,
                    order: tutorials.order,
                })
                .from(tutorials)
                .where(and(...conditions))
                .orderBy(orderFn(sortColumn!))
                .limit(filters.limit)
                .offset(offset);

            // Get user progress
            let userProgress: Record<string, { isCompleted: boolean; readingProgress: number }> = {};

            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (session?.user?.id) {
                const progressRecords = await db
                    .select({
                        tutorialId: progress.tutorialId,
                        isCompleted: progress.isCompleted,
                        readingProgress: progress.readingProgress,
                    })
                    .from(progress)
                    .where(eq(progress.userId, session.user.id));

                userProgress = progressRecords.reduce((acc, p) => {
                    if (p.tutorialId) {
                        acc[p.tutorialId] = {
                            isCompleted: p.isCompleted,
                            readingProgress: p.readingProgress || 0,
                        };
                    }
                    return acc;
                }, {} as Record<string, { isCompleted: boolean; readingProgress: number }>);
            }

            const tutorialsWithProgress = tutorialList.map((tutorial) => ({
                ...tutorial,
                isCompleted: userProgress[tutorial.id]?.isCompleted || false,
                readingProgress: userProgress[tutorial.id]?.readingProgress || 0,
            }));

            // Get available tags
            const allTagsResult = await db
                .selectDistinct({ tag: sql<string>`unnest(${tutorials.tags})` })
                .from(tutorials)
                .where(eq(tutorials.isPublished, true));

            const allTags = allTagsResult.map(r => r.tag).filter(Boolean).sort();

            return {
                success: true,
                data: tutorialsWithProgress,
                meta: {
                    availableTags: allTags,
                },
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total,
                    totalPages: Math.ceil(total / filters.limit),
                },
            };
        } catch (error) {
            console.error('Error fetching tutorials:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });


// ----------------------------------------------------------------------------
// GET TUTORIAL (DETAIL)
// ----------------------------------------------------------------------------

const TutorialDetailSchema = z.object({
    slug: z.string(),
});

export const getTutorial = createServerFn({ method: 'GET' })
    .inputValidator((data: unknown) => TutorialDetailSchema.parse(data))
    .handler(async ({ data: { slug } }) => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { tutorials, progress, challenges } = await import('@/db/schema');
            const { eq, and, asc, gt } = await import('drizzle-orm');

            // Fetch tutorial
            const tutorial = await db.query.tutorials.findFirst({
                where: and(
                    eq(tutorials.slug, slug),
                    eq(tutorials.isPublished, true)
                ),
                with: {
                    challenges: {
                        columns: {
                            slug: true,
                            title: true,
                            difficulty: true,
                            type: true,
                            xpReward: true,
                            category: true,
                        },
                        where: eq(challenges.isPublished, true),
                        orderBy: asc(challenges.order),
                    },
                },
            });

            if (!tutorial) {
                throw new Error('Tutorial not found');
            }

            // User progress
            let userProgressData = null;

            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (session?.user?.id) {
                const progressRecord = await db.query.progress.findFirst({
                    where: and(
                        eq(progress.userId, session.user.id),
                        eq(progress.tutorialId, tutorial.id)
                    ),
                });

                if (progressRecord) {
                    userProgressData = {
                        isCompleted: progressRecord.isCompleted,
                        readingProgress: progressRecord.readingProgress,
                        lastAccessedAt: progressRecord.lastAccessedAt,
                    };
                }
            }

            // Next Tutorial
            const nextTutorial = await db.query.tutorials.findFirst({
                where: and(
                    eq(tutorials.isPublished, true),
                    tutorial.order !== null ? gt(tutorials.order, tutorial.order) : undefined
                ),
                orderBy: asc(tutorials.order),
                columns: {
                    slug: true,
                    title: true,
                },
            });

            return {
                success: true,
                data: {
                    ...tutorial,
                    userProgress: userProgressData,
                    nextTutorial: nextTutorial ? {
                        slug: nextTutorial.slug,
                        title: nextTutorial.title
                    } : null,
                },
            };

        } catch (error) {
            console.error('Error fetching tutorial detail:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });

// ----------------------------------------------------------------------------
// UPDATE TUTORIAL PROGRESS
// ----------------------------------------------------------------------------

const UpdateTutorialProgressSchema = z.object({
    slug: z.string(),
    readingProgress: z.number().min(0).max(100),
});

export const updateTutorialProgress = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateTutorialProgressSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { tutorials, progress } = await import('@/db/schema');
            const { eq, and } = await import('drizzle-orm');

            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                return { success: false, error: 'Unauthorized' };
            }

            const userId = session.user.id;
            const { slug, readingProgress: newProgress } = input;

            // Get tutorial id
            const tutorial = await db.query.tutorials.findFirst({
                where: eq(tutorials.slug, slug),
                columns: { id: true },
            });

            if (!tutorial) {
                return { success: false, error: 'Tutorial not found' };
            }

            // Check existing progress
            const existingProgress = await db.query.progress.findFirst({
                where: and(
                    eq(progress.userId, userId),
                    eq(progress.tutorialId, tutorial.id)
                ),
            });

            if (existingProgress) {
                // Only update if not completed or just reading progress
                await db
                    .update(progress)
                    .set({
                        readingProgress: newProgress,
                        lastAccessedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(progress.id, existingProgress.id));
            } else {
                await db.insert(progress).values({
                    userId,
                    tutorialId: tutorial.id,
                    readingProgress: newProgress,
                    isCompleted: false,
                    lastAccessedAt: new Date(),
                });
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });


// ----------------------------------------------------------------------------
// COMPLETE TUTORIAL
// ----------------------------------------------------------------------------

const CompleteTutorialSchema = z.object({
    slug: z.string(),
});

export const completeTutorial = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => CompleteTutorialSchema.parse(data))
    .handler(async ({ data: { slug } }) => {
        try {
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { tutorials, progress } = await import('@/db/schema');
            const { eq, and } = await import('drizzle-orm');
            const { logger } = await import('@/lib/logger');
            const { checkAchievements } = await import('@/lib/achievements');
            const { getUserStats, getEarnedAchievementIds, awardAchievements } = await import('@/lib/stats');

            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                return { success: false, error: 'Unauthorized' };
            }

            const userId = session.user.id;

            // Get tutorial id
            const tutorial = await db.query.tutorials.findFirst({
                where: eq(tutorials.slug, slug),
                columns: { id: true, title: true },
            });

            if (!tutorial) {
                return { success: false, error: 'Tutorial not found' };
            }

            // Upsert progress
            const existingProgress = await db.query.progress.findFirst({
                where: and(
                    eq(progress.userId, userId),
                    eq(progress.tutorialId, tutorial.id)
                ),
            });

            const isFirstCompletion = !existingProgress || !existingProgress.isCompleted;

            if (existingProgress) {
                await db
                    .update(progress)
                    .set({
                        isCompleted: true,
                        readingProgress: 100,
                        completedAt: existingProgress.isCompleted ? existingProgress.completedAt : new Date(),
                        lastAccessedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(progress.id, existingProgress.id));
            } else {
                await db.insert(progress).values({
                    userId,
                    tutorialId: tutorial.id,
                    isCompleted: true,
                    readingProgress: 100,
                    completedAt: new Date(),
                    lastAccessedAt: new Date(),
                });
            }

            // Check achievements if first completion
            let newAchievements: { id: string; name: string; icon: string }[] = [];

            if (isFirstCompletion) {
                try {
                    const userStats = await getUserStats(userId);
                    const alreadyEarned = await getEarnedAchievementIds(userId);
                    const earnedAchievements = checkAchievements(userStats, alreadyEarned);

                    if (earnedAchievements.length > 0) {
                        await awardAchievements(userId, earnedAchievements.map(a => a.id));
                        newAchievements = earnedAchievements.map(a => ({
                            id: a.id,
                            name: a.name,
                            icon: a.icon,
                        }));
                        logger.info(`[Achievements] User ${userId} earned: ${earnedAchievements.map(a => a.name).join(', ')}`);
                    }
                } catch (error) {
                    logger.error('Error checking achievements:', error);
                }
            }

            return {
                success: true,
                newAchievements,
            };

        } catch (error) {
            console.error('Error completing tutorial:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
