import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// CREATE SUBMISSION
// ----------------------------------------------------------------------------

const CreateSubmissionSchema = z.object({
    challengeSlug: z.string().min(1, 'Challenge slug is required'),
    code: z.string().min(1, 'Code is required'),
    testResults: z.array(z.object({
        testCaseId: z.string().uuid().optional(),
        passed: z.boolean(),
        output: z.any().optional(),
        error: z.string().optional(),
    })),
    executionTime: z.number().optional(),
    locale: z.string().default('en'),
});

export const createSubmission = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => CreateSubmissionSchema.parse(data))
    .handler(async ({ data: input }) => {
        const { locale = 'en' } = input;
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { submissions, challenges, progress, users, testCases, achievements } = await import('@/db/schema');
            const { eq, and, sql, inArray } = await import('drizzle-orm');
            const { checkLevelUp } = await import('@/lib/gamification');
            const { checkAchievements } = await import('@/lib/achievements');
            const { getUserStats, getEarnedAchievementIds, awardAchievements } = await import('@/lib/stats');
            const { logger } = await import('@/lib/logger');

            const headers = getRequestHeaders() as Headers;
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                return { success: false, error: 'Unauthorized' };
            }

            const userId = session.user.id;
            const { challengeSlug, code, testResults, executionTime } = input;

            // Get challenge by slug
            const challenge = await db.query.challenges.findFirst({
                where: eq(challenges.slug, challengeSlug),
            });

            if (!challenge) {
                return { success: false, error: 'Challenge not found' };
            }

            // Get total test cases
            const allTestCases = await db
                .select({ id: testCases.id })
                .from(testCases)
                .where(eq(testCases.challengeId, challenge.id));

            const testsTotal = allTestCases.length;
            const testsPassed = testResults.filter(r => r.passed).length;
            const isPassed = testsPassed === testsTotal && testsTotal > 0;

            // Check if this is the first successful completion
            const existingProgress = await db.query.progress.findFirst({
                where: and(
                    eq(progress.userId, userId),
                    eq(progress.challengeId, challenge.id)
                ),
            });

            const isFirstCompletion = isPassed && (!existingProgress || !existingProgress.isCompleted);

            // Calculate XP earned (only on first completion)
            let xpEarned = 0;
            let levelUpInfo = null;

            if (isFirstCompletion) {
                xpEarned = challenge.xpReward;

                // Get current user XP
                const user = await db.query.users.findFirst({
                    where: eq(users.id, userId),
                });

                if (user) {
                    // Check for level up
                    levelUpInfo = checkLevelUp(user.xp, xpEarned);

                    // Update user XP and level
                    await db
                        .update(users)
                        .set({
                            xp: user.xp + xpEarned,
                            level: levelUpInfo.newLevel,
                            updatedAt: new Date(),
                        })
                        .where(eq(users.id, userId));

                    logger.info(`[Submission] First completion for user ${userId}. Awarding ${xpEarned} XP.`);

                    // Increment challenge completion count
                    await db
                        .update(challenges)
                        .set({
                            completionCount: challenge.completionCount + 1,
                        })
                        .where(eq(challenges.id, challenge.id));
                }
            } else if (isPassed) {
                logger.info(`[Submission] Challenge ${challenge.id} passed but not first completion. No XP awarded.`);
            }

            // Create submission record
            const [submission] = await db
                .insert(submissions)
                .values({
                    userId,
                    challengeId: challenge.id,
                    code,
                    isPassed,
                    xpEarned,
                    executionTime,
                    testsPassed,
                    testsTotal,
                    errorMessage: testResults.find(r => r.error)?.error,
                })
                .returning();

            // Update or create progress record
            if (existingProgress) {
                await db
                    .update(progress)
                    .set({
                        isCompleted: existingProgress.isCompleted || isPassed,
                        completedAt: isPassed && !existingProgress.isCompleted ? new Date() : existingProgress.completedAt,
                        attempts: (existingProgress.attempts || 0) + 1,
                        bestSubmissionId: isPassed ? submission.id : existingProgress.bestSubmissionId,
                        lastAccessedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(progress.id, existingProgress.id));
            } else {
                await db.insert(progress).values({
                    userId,
                    challengeId: challenge.id,
                    isCompleted: isPassed,
                    completedAt: isPassed ? new Date() : null,
                    attempts: 1,
                    bestSubmissionId: isPassed ? submission.id : null,
                    lastAccessedAt: new Date(),
                });
            }

            // Check and award achievements if passed
            let newAchievements: { id: string; name: string; icon: string }[] = [];
            if (isPassed) {
                try {
                    // Get real user stats from DB
                    const userStats = await getUserStats(userId);
                    const alreadyEarned = await getEarnedAchievementIds(userId);

                    const earnedAchievements = checkAchievements(userStats, alreadyEarned);

                    if (earnedAchievements.length > 0) {
                        // Award the achievements
                        await awardAchievements(userId, earnedAchievements.map(a => a.id));

                        // Get localized names from DB
                        const dbAwarded = await db
                            .select({
                                id: achievements.id,
                                name: sql`COALESCE(${achievements.name}->>${locale}, ${achievements.name}->>'en', '')`,
                                icon: achievements.icon,
                            })
                            .from(achievements)
                            .where(inArray(achievements.slug, earnedAchievements.map(a => a.id)));

                        newAchievements = dbAwarded.map(a => ({
                            id: a.id,
                            name: a.name as string,
                            icon: a.icon || '',
                        }));

                        logger.info(`[Achievements] User ${userId} earned: ${newAchievements.map(a => a.name).join(', ')}`);
                    }
                } catch (error) {
                    logger.error('Error checking achievements:', error);
                }
            }

            return {
                success: true,
                data: {
                    submission: {
                        id: submission.id,
                        isPassed,
                        testsPassed,
                        testsTotal,
                        xpEarned,
                        executionTime,
                    },
                    isFirstCompletion,
                    levelUp: levelUpInfo?.leveledUp ? {
                        oldLevel: levelUpInfo.oldLevel,
                        newLevel: levelUpInfo.newLevel,
                        levelsGained: levelUpInfo.levelsGained,
                    } : null,
                    newAchievements,
                },
            };

        } catch (error) {
            console.error('Error submitting solution:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });


// ----------------------------------------------------------------------------
// GET SUBMISSIONS (LIST)
// ----------------------------------------------------------------------------

const GetSubmissionsSchema = z.object({
    challengeId: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().max(50).default(10),
    locale: z.string().default('en'),
});

export const getSubmissions = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => GetSubmissionsSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { submissions, challenges } = await import('@/db/schema');
            const { eq, and, desc, sql } = await import('drizzle-orm');

            const headers = getRequestHeaders() as Headers;
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                return { success: false, error: 'Unauthorized' };
            }

            const userId = session.user.id;
            const { challengeId, page, limit, locale } = input;

            // Build conditions
            const conditions = [eq(submissions.userId, userId)];

            if (challengeId) {
                conditions.push(eq(submissions.challengeId, challengeId));
            }

            // Get total count
            const [countResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(submissions)
                .where(and(...conditions));

            const total = countResult?.count || 0;

            // Get submissions
            const offset = (page - 1) * limit;

            const userSubmissions = await db
                .select({
                    id: submissions.id,
                    challengeId: submissions.challengeId,
                    challengeTitle: sql<string>`COALESCE(${challenges.title}->>${locale}, ${challenges.title}->>'en', '')`,
                    challengeSlug: challenges.slug,
                    isPassed: submissions.isPassed,
                    xpEarned: submissions.xpEarned,
                    testsPassed: submissions.testsPassed,
                    testsTotal: submissions.testsTotal,
                    executionTime: submissions.executionTime,
                    createdAt: submissions.createdAt,
                })
                .from(submissions)
                .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
                .where(and(...conditions))
                .orderBy(desc(submissions.createdAt))
                .limit(limit)
                .offset(offset);

            return {
                success: true,
                data: userSubmissions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
