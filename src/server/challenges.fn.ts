import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, progress, submissions } from '@/db/schema';
import { eq, and, asc, desc, sql, gt, or, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { obfuscate } from '@/lib/obfuscator';

// Helper for localizable fields (still needed for DB records)
const getLocalizedValue = (value: unknown, locale: string): string => {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, string>;
  return obj[locale] || obj['en'] || '';
};

// ----------------------------------------------------------------------------
// GET CHALLENGES (LIST) - NOW USING FILESYSTEM
// ----------------------------------------------------------------------------

const ChallengeFiltersSchema = z.object({
  locale: z.string().default('en'),
  type: z
    .enum([
      'JAVASCRIPT',
      'PLAYWRIGHT',
      'CSS_SELECTOR',
      'XPATH_SELECTOR',
      'SELECTOR',
    ])
    .optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().max(1000).default(50),
  sortBy: z
    .enum(['order', 'difficulty', 'xpReward', 'completionCount'])
    .default('order'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getChallenges = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => ChallengeFiltersSchema.parse(data))
  .handler(async ({ data: filters }) => {
    try {
      // Dynamically import server-only modules
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { getChallengeList } = await import('./content.server');

      // Load challenges from filesystem
      let allChallenges = await getChallengeList(filters.locale, {
        type: filters.type === 'SELECTOR' ? undefined : filters.type,
        difficulty: filters.difficulty,
        category: filters.category,
        search: filters.search,
      });

      // Handle SELECTOR type (both CSS and XPath)
      if (filters.type === 'SELECTOR') {
        allChallenges = allChallenges.filter(
          (c) => c.type === 'CSS_SELECTOR' || c.type === 'XPATH_SELECTOR',
        );
      }

      // Sort
      allChallenges.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'order':
            comparison = a.order - b.order;
            break;
          case 'xpReward':
            comparison = a.xpReward - b.xpReward;
            break;
          case 'difficulty':
            const diffOrder = { EASY: 1, MEDIUM: 2, HARD: 3 };
            comparison =
              (diffOrder[a.difficulty as keyof typeof diffOrder] || 0) -
              (diffOrder[b.difficulty as keyof typeof diffOrder] || 0);
            break;
          default:
            comparison = a.order - b.order;
        }
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });

      const total = allChallenges.length;

      // Pagination
      const offset = (filters.page - 1) * filters.limit;
      const paginatedChallenges = allChallenges.slice(
        offset,
        offset + filters.limit,
      );

      // Get DB records for completionCount and IDs
      const slugs = paginatedChallenges.map((c) => c.slug);
      const dbRecords =
        slugs.length > 0
          ? await db
            .select({
              slug: challenges.slug,
              id: challenges.id,
              completionCount: challenges.completionCount,
            })
            .from(challenges)
            .where(inArray(challenges.slug, slugs))
          : [];

      const dbBySlug = new Map(dbRecords.map((r) => [r.slug, r]));

      // Get user progress
      let userProgress: Record<string, boolean> = {};
      const headers = getRequestHeaders() as Headers;
      const session = await auth.api.getSession({ headers });

      if (session?.user?.id && dbRecords.length > 0) {
        const challengeIds = dbRecords.map((r) => r.id);
        const progressRecords = await db
          .select({
            challengeId: progress.challengeId,
            isCompleted: progress.isCompleted,
          })
          .from(progress)
          .where(
            and(
              eq(progress.userId, session.user.id),
              inArray(progress.challengeId, challengeIds),
            ),
          );

        userProgress = progressRecords.reduce(
          (acc, p) => {
            if (p.challengeId) {
              acc[p.challengeId] = p.isCompleted;
            }
            return acc;
          },
          {} as Record<string, boolean>,
        );
      }

      // Merge filesystem content with DB data
      const challengesWithProgress = paginatedChallenges.map((challenge) => {
        const dbRecord = dbBySlug.get(challenge.slug);
        return {
          id: dbRecord?.id || challenge.slug,
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          instructions: challenge.instructions,
          type: challenge.type,
          difficulty: challenge.difficulty,
          category: challenge.category,
          xpReward: challenge.xpReward,
          order: challenge.order,
          tags: challenge.tags,
          completionCount: dbRecord?.completionCount || 0,
          isCompleted: dbRecord ? userProgress[dbRecord.id] || false : false,
        };
      });

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
// GET CHALLENGE (DETAIL) - NOW USING FILESYSTEM
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
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');
      const { getChallengeContent, getChallengeList } =
        await import('./content.server');

      // Load challenge content from filesystem
      const challengeContent = await getChallengeContent(slug, locale);

      if (!challengeContent) {
        throw new Error('Challenge not found');
      }

      // Security Check
      if (challengeContent.tags?.includes('coming-soon')) {
        throw new Error('This challenge is coming soon!');
      }

      // Get DB record for dynamic data
      const dbChallenge = await db.query.challenges.findFirst({
        where: and(eq(challenges.slug, slug), eq(challenges.isPublished, true)),
        columns: {
          id: true,
          completionCount: true,
        },
      });

      // Prepare test cases from filesystem
      // Obfuscate sensitive inputs for selector challenges
      const processedTestCases = challengeContent.testCases.map((tc, index) => ({
        id: `tc-${index}`,
        description: tc.description,
        input: tc.expectedOutput, // For display purposes
        expectedOutput: tc.expectedOutput,
        order: index,
        isHidden: tc.isHidden,
      }));

      // Filter visible test cases and obfuscate
      const visibleTestCases = processedTestCases
        .filter((tc) => !tc.isHidden)
        .map((tc) => {
          if (
            challengeContent.type === 'CSS_SELECTOR' ||
            challengeContent.type === 'XPATH_SELECTOR'
          ) {
            const output = tc.expectedOutput as {
              selector?: string;
              xpath?: string;
            };
            if (output?.selector) {
              return { ...tc, input: { selector: obfuscate(output.selector) } };
            }
            if (output?.xpath) {
              return { ...tc, input: { xpath: obfuscate(output.xpath) } };
            }
          }
          return tc;
        });

      const hiddenTestCaseCount = processedTestCases.filter(
        (tc) => tc.isHidden,
      ).length;

      // Get related tutorial if specified
      let tutorialData = null;
      if (challengeContent.tutorialSlug) {
        const { getTutorialContent } = await import('./content.server');
        const tutorial = await getTutorialContent(
          challengeContent.tutorialSlug,
          locale,
        );
        if (tutorial) {
          tutorialData = {
            slug: tutorial.slug,
            title: tutorial.title,
          };
        }
      }

      // Get user progress & best submission
      let userProgressData = null;
      let bestSubmissionData = null;

      const headers = getRequestHeaders() as Headers;
      const session = await auth.api.getSession({ headers });

      if (session?.user?.id && dbChallenge) {
        const userId = session.user.id;

        const progressRecord = await db.query.progress.findFirst({
          where: and(
            eq(progress.userId, userId),
            eq(progress.challengeId, dbChallenge.id),
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

      // Next Challenge Logic (from filesystem)
      const allChallenges = await getChallengeList(locale);
      const currentOrder = challengeContent.order;
      const currentCategory = challengeContent.category;

      // Try same category first
      let nextChallenge = allChallenges
        .filter((c) => c.category === currentCategory && c.order > currentOrder)
        .sort((a, b) => a.order - b.order)[0];

      // Fallback to any category
      if (!nextChallenge) {
        nextChallenge = allChallenges
          .filter((c) => c.order > currentOrder)
          .sort((a, b) => a.order - b.order)[0];
      }

      return {
        success: true,
        data: {
          id: dbChallenge?.id || slug,
          slug: challengeContent.slug,
          title: challengeContent.title,
          description: challengeContent.description,
          instructions: challengeContent.instructions,
          type: challengeContent.type,
          difficulty: challengeContent.difficulty,
          category: challengeContent.category,
          xpReward: challengeContent.xpReward,
          order: challengeContent.order,
          htmlContent: challengeContent.htmlContent,
          starterCode: challengeContent.starterCode,
          tags: challengeContent.tags,
          completionCount: dbChallenge?.completionCount || 0,
          tutorial: tutorialData,
          testCases: visibleTestCases,
          hiddenTestCaseCount,
          userProgress: userProgressData,
          bestSubmission: bestSubmissionData,
          nextChallenge: nextChallenge
            ? {
              slug: nextChallenge.slug,
              title: nextChallenge.title,
            }
            : null,
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
