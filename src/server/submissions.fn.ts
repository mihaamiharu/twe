import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from './auth.mw';
import { db } from '@/db';
import {
  submissions,
  challenges,
  progress,
  users,
  testCases,
  achievements,
} from '@/db/schema';
import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import { checkLevelUp } from '@/lib/gamification';
import { checkAchievements } from '@/lib/achievements';
import {
  getUserStats,
  getEarnedAchievementIds,
  awardAchievements,
} from '@/lib/stats';
import { logger } from '@/lib/logger';
import {
  type LocalizedString,
  type TestCaseDefinition,
} from '@/lib/validations';
import { getRawChallengeContent } from './content.server';

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

const CreateSubmissionSchema = z.object({
  challengeSlug: z.string().min(1, 'Challenge slug is required'),
  code: z.string().min(1, 'Code is required'),
  isPractice: z.boolean().optional().default(false),
  testResults: z.array(
    z.object({
      testCaseId: z.string().uuid().optional(),
      passed: z.boolean(),
      output: z.unknown().optional(),
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
  context: { user: { id: string } };
}) => {
  const { locale = 'en' } = input;
  try {
    const userId = context.user.id;
    const { challengeSlug, code, testResults, executionTime, isPractice } = input;

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

    // Get challenge by slug
    let challenge = await db.query.challenges.findFirst({
      where: eq(challenges.slug, challengeSlug),
    });

    if (!challenge) {
      // LAZY SYNC: Check if challenge exists in filesystem

      // Get raw content (with full localized objects)
      const fsChallenge = await getRawChallengeContent(challengeSlug);

      if (fsChallenge) {
        logger.info(`[Submission] Lazy syncing challenge: ${challengeSlug}`);

        // Insert challenge
        const [newChallenge] = await db
          .insert(challenges)
          .values({
            slug: fsChallenge.slug,
            title: fsChallenge.title as LocalizedString,
            type: fsChallenge.type,
            difficulty: fsChallenge.difficulty,
            xpReward: fsChallenge.xpReward,
            order: fsChallenge.order,
            category: fsChallenge.category,
            tags: fsChallenge.tags,
            isPublished: true, // Auto-publish if found on FS during submission
          })
          .returning();

        // Insert test cases
        if (fsChallenge.testCases && fsChallenge.testCases.length > 0) {
          await db.insert(testCases).values(
            fsChallenge.testCases.map((tc: TestCaseDefinition, index: number) => ({
              challengeId: newChallenge.id,
              description: tc.description,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden || false,
              order: index,
            })),
          );
        }

        // Use the newly created challenge
        challenge = newChallenge;
      } else {
        return {
          success: false,
          error: getErrorMessage('challengeNotFound', locale),
        };
      }
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

    // Check if this is the first successful completion
    const existingProgress = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, userId),
        eq(progress.challengeId, challenge.id),
      ),
    });

    const isFirstCompletion =
      isPassed && (!existingProgress || !existingProgress.isCompleted);

    // Calculate XP earned (only on first completion)
    let xpEarned = 0;
    let levelUpInfo = null;

    if (isFirstCompletion) {
      // Check if hint was used for this challenge - apply 50% XP penalty
      const hintUsed = existingProgress?.usedHint || false;
      const xpMultiplier = hintUsed ? 0.5 : 1;
      xpEarned = Math.floor(challenge.xpReward * xpMultiplier);

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

        logger.info(
          `[Submission] First completion for user ${userId}. Awarding ${xpEarned} XP${hintUsed ? ' (50% penalty for hint usage)' : ''}.`,
        );

        // Increment challenge completion count
        await db
          .update(challenges)
          .set({
            completionCount: challenge.completionCount + 1,
          })
          .where(eq(challenges.id, challenge.id));
      }
    } else if (isPassed) {
      logger.info(
        `[Submission] Challenge ${challenge.id} passed but not first completion. No XP awarded.`,
      );
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
        errorMessage: testResults.find((r) => r.error)?.error,
      })
      .returning();

    // Update or create progress record
    if (existingProgress) {
      await db
        .update(progress)
        .set({
          isCompleted: existingProgress.isCompleted || isPassed,
          completedAt:
            isPassed && !existingProgress.isCompleted
              ? new Date()
              : existingProgress.completedAt,
          attempts: (existingProgress.attempts || 0) + 1,
          bestSubmissionId: isPassed
            ? submission.id
            : existingProgress.bestSubmissionId,
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
          await awardAchievements(
            userId,
            earnedAchievements.map((a) => a.id),
          );

          // Get localized names from DB
          const dbAwarded = await db
            .select({
              id: achievements.id,
              name: sql`COALESCE(${achievements.name}->>${locale}, ${achievements.name}->>'en', '')`,
              icon: achievements.icon,
            })
            .from(achievements)
            .where(
              inArray(
                achievements.slug,
                earnedAchievements.map((a) => a.id),
              ),
            );

          newAchievements = dbAwarded.map((a) => ({
            id: a.id,
            name: a.name as string,
            icon: a.icon || '',
          }));

          logger.info(
            `[Achievements] User ${userId} earned: ${newAchievements.map((a) => a.name).join(', ')}`,
          );
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
        levelUp: levelUpInfo?.leveledUp
          ? {
            oldLevel: levelUpInfo.oldLevel,
            newLevel: levelUpInfo.newLevel,
            levelsGained: levelUpInfo.levelsGained,
          }
          : null,
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
