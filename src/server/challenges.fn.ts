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
      const { db } = await import('@/db');
      const { challenges, progress } = await import('@/db/schema');
      const { eq, and, or, ilike, sql, desc, asc, not } = await import('drizzle-orm');

      const headers = getRequestHeaders() as Headers;
      const session = await auth.api.getSession({ headers });
      const userId = session?.user?.id;
      const locale = filters.locale;

      // Build WHERE conditions
      const conditions = [eq(challenges.isPublished, true)];

      if (filters.difficulty) {
        conditions.push(eq(challenges.difficulty, filters.difficulty));
      }

      if (filters.type) {
        if (filters.type === 'SELECTOR') {
          // Non-null assertion safe: or() always has two conditions here
          conditions.push(or(eq(challenges.type, 'CSS_SELECTOR'), eq(challenges.type, 'XPATH_SELECTOR'))!);
        } else {
          conditions.push(eq(challenges.type, filters.type));
        }
      }

      if (filters.category) {
        conditions.push(eq(challenges.category, filters.category));
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        // Search in localized title or description (checking both current locale and en fallback)
        // Non-null assertion safe: or() always has four conditions here
        conditions.push(
          or(
            sql`${challenges.title}->>${locale} ILIKE ${searchPattern}`,
            sql`${challenges.title}->>'en' ILIKE ${searchPattern}`,
            sql`${challenges.description}->>${locale} ILIKE ${searchPattern}`,
            sql`${challenges.description}->>'en' ILIKE ${searchPattern}`
          )!
        );
      }

      // Calculate Offset
      const offset = (filters.page - 1) * filters.limit;

      // Build Query with $dynamic() for proper TypeScript support
      // This enables dynamic chaining (joins, orderBy, limit) without type errors
      const query = db
        .select({
          id: challenges.id,
          slug: challenges.slug,
          title: sql<string>`COALESCE(${challenges.title}->>${locale}, ${challenges.title}->>'en', '')`,
          description: sql<string>`COALESCE(${challenges.description}->>${locale}, ${challenges.description}->>'en', '')`,
          type: challenges.type,
          difficulty: challenges.difficulty,
          category: challenges.category,
          xpReward: challenges.xpReward,
          order: challenges.order,
          tags: challenges.tags,
          completionCount: challenges.completionCount,
          isCompleted: userId ? sql<boolean>`${progress.isCompleted} IS TRUE` : sql<boolean>`false`,
        })
        .from(challenges)
        .where(and(...conditions))
        .$dynamic();

      // Join Progress if user is logged in
      if (userId) {
        query.leftJoin(progress, and(eq(progress.challengeId, challenges.id), eq(progress.userId, userId)));
      }

      // Apply Sort - determine orderBy clause
      const orderByClause = (() => {
        switch (filters.sortBy) {
          case 'xpReward':
            return filters.sortOrder === 'desc' ? desc(challenges.xpReward) : asc(challenges.xpReward);
          case 'difficulty':
            return filters.sortOrder === 'desc' ? desc(challenges.difficulty) : asc(challenges.difficulty);
          case 'completionCount':
            return filters.sortOrder === 'desc' ? desc(challenges.completionCount) : asc(challenges.completionCount);
          default:
            return filters.sortOrder === 'desc' ? desc(challenges.order) : asc(challenges.order);
        }
      })();

      query.orderBy(orderByClause);

      // Apply Pagination
      query.limit(filters.limit).offset(offset);

      const data = await query;

      // Get Total Count for Pagination (separate efficient query)
      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(challenges)
        .where(and(...conditions));

      const total = Number(countQuery[0].count);

      return {
        success: true,
        data: data.map(c => ({
          ...c,
          // Ensure tags is array
          tags: c.tags || [],
          // UI expects explicit boolean
          isCompleted: Boolean(c.isCompleted)
        })),
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
        error: 'An error occurred while processing your request.',
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
            usedHint: progressRecord.usedHint,
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

      // Previous Challenge Logic
      // Try same category first
      let prevChallenge = allChallenges
        .filter((c) => c.category === currentCategory && c.order < currentOrder)
        .sort((a, b) => b.order - a.order)[0];

      // Fallback to any category
      if (!prevChallenge) {
        prevChallenge = allChallenges
          .filter((c) => c.order < currentOrder)
          .sort((a, b) => b.order - a.order)[0];
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
          files: challengeContent.files,
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
          prevChallenge: prevChallenge
            ? {
              slug: prevChallenge.slug,
              title: prevChallenge.title,
            }
            : null,
        },
      };
    } catch (error) {
      logger.error('Error fetching challenge detail:', error);
      return {
        success: false,
        error: 'An error occurred while processing your request.',
      };
    }
  });
