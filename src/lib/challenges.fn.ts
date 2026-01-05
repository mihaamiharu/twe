import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, progress, testCases, submissions } from '@/db/schema';
import { eq, and, asc, desc, sql, gt, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { obfuscate } from '@/lib/obfuscator';

// Helper for localizable fields
const getLocalizedValue = (value: any, locale: string): string => {
    if (!value || typeof value !== 'object') return '';
    return value[locale] || value['en'] || '';
};

// ----------------------------------------------------------------------------
// GET CHALLENGES (LIST)
// ----------------------------------------------------------------------------

const ChallengeFiltersSchema = z.object({
    locale: z.string().default('en'),
    type: z.enum(['JAVASCRIPT', 'PLAYWRIGHT', 'CSS_SELECTOR', 'XPATH_SELECTOR', 'SELECTOR']).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().max(500).default(50),
    sortBy: z.enum(['order', 'difficulty', 'xpReward', 'completionCount']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getChallenges = createServerFn({ method: 'GET' })
    .inputValidator((data: unknown) => ChallengeFiltersSchema.parse(data))
    .handler(async ({ data: filters }) => {
        try {
            // Dynamically import server-only modules
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');

            // Build conditions
            const conditions = [eq(challenges.isPublished, true)];

            if (filters.type) {
                if (filters.type === 'SELECTOR') {
                    conditions.push(
                        or(
                            eq(challenges.type, 'CSS_SELECTOR'),
                            eq(challenges.type, 'XPATH_SELECTOR')
                        )!
                    );
                } else {
                    conditions.push(eq(challenges.type, filters.type));
                }
            }
            if (filters.difficulty) {
                conditions.push(eq(challenges.difficulty, filters.difficulty));
            }
            if (filters.category) {
                conditions.push(eq(challenges.category, filters.category));
            }
            if (filters.search) {
                conditions.push(
                    or(
                        sql`${challenges.title}->>${filters.locale} ILIKE ${`%${filters.search}%`}`,
                        sql`${challenges.description}->>${filters.locale} ILIKE ${`%${filters.search}%`}`
                    )!
                );
            }

            // Get total count
            const [countResult] = await db
                .select({ count: sql<number>`count(*):: int` })
                .from(challenges)
                .where(and(...conditions));

            const total = countResult?.count || 0;

            // Determine sort
            const sortColumnResult = {
                order: challenges.order,
                difficulty: challenges.difficulty,
                xpReward: challenges.xpReward,
                completionCount: challenges.completionCount,
            }[filters.sortBy];
            const sortColumn = sortColumnResult || challenges.order;

            const orderFn = filters.sortOrder === 'desc' ? desc : asc;

            // Pagination
            const offset = (filters.page - 1) * filters.limit;

            const challengeList = await db
                .select({
                    id: challenges.id,
                    slug: challenges.slug,
                    title: sql<string>`COALESCE(${challenges.title}->>${filters.locale}, ${challenges.title}->>'en', '')`,
                    description: sql<string>`COALESCE(${challenges.description}->>${filters.locale}, ${challenges.description}->>'en', '')`,
                    instructions: sql<string>`COALESCE(${challenges.instructions}->>${filters.locale}, ${challenges.instructions}->>'en', '')`,
                    type: challenges.type,
                    difficulty: challenges.difficulty,
                    category: challenges.category,
                    xpReward: challenges.xpReward,
                    order: challenges.order,
                    tags: challenges.tags,
                    completionCount: challenges.completionCount,
                })
                .from(challenges)
                .where(and(...conditions))
                .orderBy(orderFn(sortColumn)) // bang ok because default is 'order'
                .limit(filters.limit)
                .offset(offset);

            // Get user progress
            let userProgress: Record<string, boolean> = {};
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (session?.user?.id) {
                const progressRecords = await db
                    .select({
                        challengeId: progress.challengeId,
                        isCompleted: progress.isCompleted,
                    })
                    .from(progress)
                    .where(eq(progress.userId, session.user.id));

                userProgress = progressRecords.reduce((acc, p) => {
                    if (p.challengeId) {
                        acc[p.challengeId] = p.isCompleted;
                    }
                    return acc;
                }, {} as Record<string, boolean>);
            }

            const challengesWithProgress = challengeList.map((challenge) => ({
                ...challenge,
                isCompleted: userProgress[challenge.id] || false,
            }));

            return {
                success: true,
                data: challengesWithProgress,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total,
                    totalPages: Math.ceil(total / filters.limit),
                },
            };
        } catch (error) {
            logger.error('Error fetching challenges:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });


// ----------------------------------------------------------------------------
// GET CHALLENGE (DETAIL)
// ----------------------------------------------------------------------------

const ChallengeDetailSchema = z.object({
    slug: z.string(),
    locale: z.string().default('en'),
});

export const getChallenge = createServerFn({ method: 'GET' })
    .inputValidator((data: unknown) => ChallengeDetailSchema.parse(data))
    // @ts-expect-error TanStack Start type inference issue with complex handler return types
    .handler(async ({ data: { slug, locale } }) => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');

            // Fetch challenge
            const challenge = await db.query.challenges.findFirst({
                where: and(
                    eq(challenges.slug, slug),
                    eq(challenges.isPublished, true)
                ),
                with: {
                    tutorial: {
                        columns: {
                            slug: true,
                            title: true,
                        },
                    },
                },
            });

            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // Security Check
            if (challenge.tags?.includes('coming-soon')) {
                throw new Error('This challenge is coming soon!');
            }

            // Fetch visible test cases
            let visibleTestCases = await db
                .select({
                    id: testCases.id,
                    description: testCases.description,
                    input: testCases.input,
                    expectedOutput: testCases.expectedOutput,
                    order: testCases.order,
                })
                .from(testCases)
                .where(
                    and(
                        eq(testCases.challengeId, challenge.id),
                        eq(testCases.isHidden, false)
                    )
                )
                .orderBy(asc(testCases.order));

            // Obfuscate sensitive inputs
            if (challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR') {
                visibleTestCases = visibleTestCases.map(tc => {
                    const input = tc.input as { selector?: string; xpath?: string };
                    if (input?.selector) {
                        return { ...tc, input: { ...input, selector: obfuscate(input.selector) } };
                    }
                    if (input?.xpath) {
                        return { ...tc, input: { ...input, xpath: obfuscate(input.xpath) } };
                    }
                    return tc;
                });
            }

            // Count hidden test cases
            const hiddenTestCasesCountResult = await db
                .select({ count: sql<number>`count(*):: int` })
                .from(testCases)
                .where(
                    and(
                        eq(testCases.challengeId, challenge.id),
                        eq(testCases.isHidden, true)
                    )
                );
            const hiddenTestCaseCount = hiddenTestCasesCountResult[0]?.count || 0;


            // Get user progress & best submission
            let userProgressData = null;
            let bestSubmissionData = null;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const headers = getRequestHeaders();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const session = await auth.api.getSession({ headers });

            if (session?.user?.id) {
                const userId = session.user.id;

                const progressRecord = await db.query.progress.findFirst({
                    where: and(
                        eq(progress.userId, userId),
                        eq(progress.challengeId, challenge.id)
                    ),
                });

                if (progressRecord) {
                    userProgressData = {
                        isCompleted: progressRecord.isCompleted,
                        attempts: progressRecord.attempts,
                        lastAccessedAt: progressRecord.lastAccessedAt,
                    };

                    if (progressRecord.bestSubmissionId) {
                        const submission = await db.query.submissions.findFirst({
                            where: eq(submissions.id, progressRecord.bestSubmissionId),
                        });

                        if (submission) {
                            bestSubmissionData = {
                                code: submission.code,
                                isPassed: submission.isPassed,
                                xpEarned: submission.xpEarned,
                                testsPassed: submission.testsPassed,
                                testsTotal: submission.testsTotal,
                                executionTime: submission.executionTime,
                            };
                        }
                    }
                }
            }

            // Next Challenge Logic
            const nextChallenge = await db.query.challenges.findFirst({
                where: and(
                    eq(challenges.isPublished, true),
                    eq(challenges.category, challenge.category || ''),
                    challenge.order !== null ? gt(challenges.order, challenge.order) : undefined
                ),
                orderBy: asc(challenges.order),
                columns: {
                    slug: true,
                    title: true,
                },
            });

            let finalNextChallenge = nextChallenge;
            if (!finalNextChallenge) {
                finalNextChallenge = await db.query.challenges.findFirst({
                    where: and(
                        eq(challenges.isPublished, true),
                        challenge.order !== null ? gt(challenges.order, challenge.order) : undefined
                    ),
                    orderBy: asc(challenges.order),
                    columns: {
                        slug: true,
                        title: true,
                    }
                });
            }

            return {
                success: true,
                data: {
                    ...challenge,
                    title: getLocalizedValue(challenge.title, locale),
                    description: getLocalizedValue(challenge.description, locale),
                    instructions: getLocalizedValue(challenge.instructions, locale),
                    tutorial: challenge.tutorial ? {
                        ...challenge.tutorial,
                        title: getLocalizedValue(challenge.tutorial.title, locale),
                    } : null,
                    testCases: visibleTestCases,
                    hiddenTestCaseCount,
                    userProgress: userProgressData,
                    bestSubmission: bestSubmissionData,
                    nextChallenge: finalNextChallenge ? {
                        slug: finalNextChallenge.slug,
                        title: getLocalizedValue(finalNextChallenge.title, locale),
                    } : null,
                },
            };

        } catch (error) {
            logger.error('Error fetching challenge detail:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
