import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { submissions, challenges, progress, users, testCases } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';
import { z } from 'zod';
import { checkLevelUp } from '@/lib/gamification';
import { checkAchievements, type UserStats } from '@/lib/achievements';

// Validation schema for submission
const submissionSchema = z.object({
    challengeId: z.string().uuid(),
    code: z.string().min(1, 'Code is required'),
    testResults: z.array(z.object({
        testCaseId: z.string().uuid().optional(),
        passed: z.boolean(),
        output: z.any().optional(),
        error: z.string().optional(),
    })),
    executionTime: z.number().optional(),
});

export const Route = createFileRoute('/api/submissions/')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const session = await auth.api.getSession({ headers: request.headers });

                    if (!session?.user?.id) {
                        return json(
                            { success: false, error: 'Unauthorized' },
                            { status: 401 }
                        );
                    }

                    const userId = session.user.id;
                    const body = await request.json();

                    // Validate input
                    const validation = submissionSchema.safeParse(body);
                    if (!validation.success) {
                        return json(
                            { success: false, error: 'Validation failed', details: validation.error.flatten() },
                            { status: 400 }
                        );
                    }

                    const { challengeId, code, testResults, executionTime } = validation.data;

                    // Get challenge
                    const challenge = await db.query.challenges.findFirst({
                        where: eq(challenges.id, challengeId),
                    });

                    if (!challenge) {
                        return json(
                            { success: false, error: 'Challenge not found' },
                            { status: 404 }
                        );
                    }

                    // Get total test cases for this challenge
                    const allTestCases = await db
                        .select({ id: testCases.id })
                        .from(testCases)
                        .where(eq(testCases.challengeId, challengeId));

                    const testsTotal = allTestCases.length;
                    const testsPassed = testResults.filter(r => r.passed).length;
                    const isPassed = testsPassed === testsTotal && testsTotal > 0;

                    // Check if this is the first successful completion
                    const existingProgress = await db.query.progress.findFirst({
                        where: and(
                            eq(progress.userId, userId),
                            eq(progress.challengeId, challengeId)
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

                            // Increment challenge completion count
                            await db
                                .update(challenges)
                                .set({
                                    completionCount: challenge.completionCount + 1,
                                })
                                .where(eq(challenges.id, challengeId));
                        }
                    }

                    // Create submission record
                    const submission = await db
                        .insert(submissions)
                        .values({
                            userId,
                            challengeId,
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
                                bestSubmissionId: isPassed ? submission[0].id : existingProgress.bestSubmissionId,
                                lastAccessedAt: new Date(),
                                updatedAt: new Date(),
                            })
                            .where(eq(progress.id, existingProgress.id));
                    } else {
                        await db.insert(progress).values({
                            userId,
                            challengeId,
                            isCompleted: isPassed,
                            completedAt: isPassed ? new Date() : null,
                            attempts: 1,
                            bestSubmissionId: isPassed ? submission[0].id : null,
                            lastAccessedAt: new Date(),
                        });
                    }

                    // Check and award achievements if passed
                    let newAchievements: string[] = [];
                    if (isPassed) {
                        try {
                            // Placeholder for actual achievement checking
                            // In a real implementation, gather user stats and check achievements
                            const userStats: UserStats = {
                                totalChallengesCompleted: 1, // Would come from DB
                                challengesByType: {},
                                totalXP: xpEarned,
                                level: levelUpInfo?.newLevel || 1,
                                currentStreak: 1,
                                longestStreak: 1,
                                tutorialsCompleted: 0,
                                perfectScores: 0,
                            };
                            const earnedAchievements = checkAchievements(userStats, new Set());
                            newAchievements = earnedAchievements.map(a => a.id);
                        } catch (error) {
                            console.error('Error checking achievements:', error);
                        }
                    }

                    return json({
                        success: true,
                        data: {
                            submission: {
                                id: submission[0].id,
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
                    });
                } catch (error) {
                    console.error('Error submitting solution:', error);
                    return json(
                        { success: false, error: 'Failed to submit solution' },
                        { status: 500 }
                    );
                }
            },

            GET: async ({ request }) => {
                try {
                    const session = await auth.api.getSession({ headers: request.headers });

                    if (!session?.user?.id) {
                        return json(
                            { success: false, error: 'Unauthorized' },
                            { status: 401 }
                        );
                    }

                    const userId = session.user.id;
                    const url = new URL(request.url);
                    const challengeId = url.searchParams.get('challengeId');
                    const page = parseInt(url.searchParams.get('page') || '1');
                    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

                    // Build conditions
                    const conditions = [eq(submissions.userId, userId)];

                    if (challengeId) {
                        conditions.push(eq(submissions.challengeId, challengeId));
                    }

                    // Get total count
                    const countResult = await db
                        .select({ count: sql<number>`count(*)::int` })
                        .from(submissions)
                        .where(and(...conditions));

                    const total = countResult[0]?.count || 0;

                    // Get submissions
                    const offset = (page - 1) * limit;

                    const userSubmissions = await db
                        .select({
                            id: submissions.id,
                            challengeId: submissions.challengeId,
                            challengeTitle: challenges.title,
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

                    return json({
                        success: true,
                        data: userSubmissions,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit),
                        },
                    });
                } catch (error) {
                    console.error('Error fetching submissions:', error);
                    return json(
                        { success: false, error: 'Failed to fetch submissions' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});
