import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from './auth.mw';
import { db } from '@/db';
import {
  submissions,
  challenges,
  progress,
  testCases,
  achievements,
} from '@/db/schema';
import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getRawChallengeContent } from './content.server';
import type { JsonValue, TestCaseDefinition } from '@/lib/content.types';
import { ensureEntityInDb } from './ensure-entity-in-db';
import { runProgressRewardTransaction } from './progress-rewards';

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const getErrorMessage = (key: string, locale: string) => {
  const errorMap: Record<string, Record<string, string>> = {
    en: {
      unauthorized: 'You must be signed in to perform this action',
      challengeNotFound: 'Challenge not found',
      slugRequired: 'Challenge slug is required',
      codeRequired: 'Code is required',
    },
    id: {
      unauthorized: 'Anda harus masuk untuk melakukan tindakan ini',
      challengeNotFound: 'Tantangan tidak ditemukan',
      slugRequired: 'Slug tantangan wajib diisi',
      codeRequired: 'Kode wajib diisi',
    },
  };
  return errorMap[locale]?.[key] || errorMap['en']?.[key] || key;
};

// ----------------------------------------------------------------------------
// CREATE SUBMISSION
// ----------------------------------------------------------------------------

export const JsonValueSchema: z.ZodType<JsonValue> = z.json();

export const CreateSubmissionSchema = z.object({
  challengeSlug: z.string().min(1, 'Challenge slug is required'),
  code: z.string().min(1, 'Code is required'),
  isPractice: z.boolean().optional().default(false),
  testResults: z.array(
    z.object({
      testCaseId: z.string().uuid().optional(),
      passed: z.boolean(),
      output: JsonValueSchema.optional(),
      error: z.string().optional(),
    }),
  ),
  executionTime: z.number().optional(),
  locale: z.string().default('en'),
});

export const challengeSubmissionHandler = async ({
  data: input,
  context,
}: {
  data: z.infer<typeof CreateSubmissionSchema>;
  context?: { user?: { id?: string } } | undefined;
}) => {
  const { locale = 'en' } = input;
  try {
    const userId = context?.user?.id;
    if (!userId) {
      return {
        success: false,
        error: getErrorMessage('unauthorized', locale),
      };
    }
    const { challengeSlug, code, testResults, executionTime, isPractice } =
      input;

    // Practice mode: skip all DB writes and return lightweight response
    if (isPractice) {
      const testsTotal = testResults.length;
      const testsPassed = testResults.filter((r) => r.passed).length;
      const isPassed = testsPassed === testsTotal && testsTotal > 0;

      return {
        success: true,
        data: {
          submission: {
            id: 'practice',
            isPassed,
            testsPassed,
            testsTotal,
            xpEarned: 0,
            executionTime,
          },
          isFirstCompletion: false,
          isPracticeMode: true,
          levelUp: null,
          newAchievements: [],
        },
      };
    }

    // A rewardable challenge must resolve through the server catalog. The
    // request supplies only the stable slug; XP and test-case facts come from
    // the server/database records below.
    const challengeContent = await getRawChallengeContent(challengeSlug);
    if (!challengeContent) {
      return {
        success: false,
        error: getErrorMessage('challengeNotFound', locale),
      };
    }

    // Get challenge by slug
    const existingChallenge = await db.query.challenges.findFirst({
      where: eq(challenges.slug, challengeSlug),
    });

    if (existingChallenge && !existingChallenge.isPublished) {
      return {
        success: false,
        error: getErrorMessage('challengeNotFound', locale),
      };
    }

    let challenge = existingChallenge;

    if (!challenge) {
      const ensuredChallenge = await ensureEntityInDb({
        slug: challengeSlug,
        findExisting: (slug) =>
          db.query.challenges.findFirst({
            where: eq(challenges.slug, slug),
          }),
        fetchContent: (slug) => getRawChallengeContent(slug),
        insert: async (fsChallenge) => {
          const [newChallenge] = await db
            .insert(challenges)
            .values({
              slug: fsChallenge.slug,
              title: fsChallenge.title,
              type: fsChallenge.type,
              difficulty: fsChallenge.difficulty,
              xpReward: fsChallenge.xpReward,
              order: fsChallenge.order,
              category: fsChallenge.category,
              tags: fsChallenge.tags,
              isPublished: true,
            })
            .returning();
          if (!newChallenge) {
            throw new Error(`Failed to create challenge ${fsChallenge.slug}`);
          }

          if (fsChallenge.testCases && fsChallenge.testCases.length > 0) {
            await db.insert(testCases).values(
              fsChallenge.testCases.map(
                (tc: TestCaseDefinition, index: number) => ({
                  challengeId: newChallenge.id,
                  description: tc.description,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.isHidden || false,
                  order: index,
                }),
              ),
            );
          }

          return newChallenge;
        },
        logger,
      });

      challenge = ensuredChallenge ?? undefined;

      if (!challenge) {
        return {
          success: false,
          error: getErrorMessage('challengeNotFound', locale),
        };
      }
    }

    if (!challenge) {
      return {
        success: false,
        error: getErrorMessage('challengeNotFound', locale),
      };
    }

    // Get total test cases
    const allTestCases = await db
      .select({ id: testCases.id })
      .from(testCases)
      .where(eq(testCases.challengeId, challenge.id));

    let testsTotal = allTestCases.length;

    // If no test cases in DB, we fallback to submitted results count ONLY for Playwright/E2E challenges
    // which use assertion-based validation rather than input/output pairs.
    const isE2OrPlaywright =
      challenge.type === 'PLAYWRIGHT' || challenge.category?.includes('e2e');

    if (testsTotal === 0 && testResults.length > 0 && isE2OrPlaywright) {
      testsTotal = testResults.length;
    }

    const testsPassed = testResults.filter((r) => r.passed).length;
    const isPassed = testsPassed === testsTotal && testsTotal > 0;

    const completion = await runProgressRewardTransaction({
      userId,
      target: {
        kind: 'challenge',
        challengeId: challenge.id,
        xpReward: challenge.xpReward,
      },
      shouldComplete: isPassed,
      onPersist: async (transaction, reward) => {
        if (reward.isFirstCompletion) {
          await transaction
            .update(challenges)
            .set({
              completionCount: sql`${challenges.completionCount} + 1`,
            })
            .where(eq(challenges.id, challenge.id));

          logger.info(
            `[Submission] First completion for user ${userId}. Awarding ${reward.xpAwarded} XP${reward.usedHint ? ' (50% penalty for hint usage)' : ''}.`,
          );
        } else if (isPassed) {
          logger.info(
            `[Submission] Challenge ${challenge.id} passed but not first completion. No XP awarded.`,
          );
        }

        const [submission] = await transaction
          .insert(submissions)
          .values({
            userId,
            challengeId: challenge.id,
            code,
            isPassed,
            xpEarned: reward.xpAwarded,
            executionTime,
            testsPassed,
            testsTotal,
            errorMessage: testResults.find((r) => r.error)?.error,
          })
          .returning();
        if (!submission) throw new Error('Failed to create submission');

        if (isPassed) {
          await transaction
            .update(progress)
            .set({ bestSubmissionId: submission.id })
            .where(eq(progress.id, reward.progressId));
        }

        let newAchievements: { id: string; name: string; icon: string }[] = [];
        if (reward.awardedAchievementSlugs.length > 0) {
          const dbAwarded = await transaction
            .select({
              id: achievements.id,
              name: sql<string>`COALESCE(${achievements.name}->>${locale}, ${achievements.name}->>'en', '')`,
              icon: achievements.icon,
            })
            .from(achievements)
            .where(inArray(achievements.slug, reward.awardedAchievementSlugs));

          newAchievements = dbAwarded.map((achievement) => ({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
          }));

          logger.info(
            `[Achievements] User ${userId} earned: ${newAchievements.map((achievement) => achievement.name).join(', ')}`,
          );
        }

        return {
          submission: {
            id: submission.id,
            isPassed,
            testsPassed,
            testsTotal,
            xpEarned: reward.xpAwarded,
            executionTime,
          },
          newAchievements,
        };
      },
    });

    return {
      success: true,
      data: {
        submission: completion.persisted.submission,
        isFirstCompletion: completion.isFirstCompletion,
        isPracticeMode: false,
        levelUp: completion.levelUp,
        newAchievements: completion.persisted.newAchievements,
      },
    };
  } catch (error) {
    console.error('Error submitting solution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const createSubmission = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => CreateSubmissionSchema.parse(data))
  .handler(challengeSubmissionHandler);

// ----------------------------------------------------------------------------
// GET SUBMISSIONS (LIST)
// ----------------------------------------------------------------------------

const GetSubmissionsSchema = z.object({
  challengeId: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().max(50).default(10),
  locale: z.string().default('en'),
});

export const getSubmissions = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => GetSubmissionsSchema.parse(data))
  .handler(async ({ data: input, context }) => {
    try {
      const userId = context.user.id;
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
