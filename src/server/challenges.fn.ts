import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { db } from '@/db';
import { challenges, progress, submissions } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { obfuscate } from '@/lib/obfuscator';
import { omitUndefined } from '@/lib/omit-undefined';
import { auth } from './auth.server';
import {
  getChallengeCatalogDetail,
  getChallengeCatalogList,
  getTutorialCatalogDetail,
} from './content-catalog.server';
import { mergeChallengeCatalogOverlay } from '@/lib/catalog-overlays';
import type { ChallengeListResponse } from '@/lib/catalog.types';
import {
  practiceDetailNotFoundFailure,
  practiceDetailOperationalFailure,
} from '@/lib/practice-detail-errors';

// ----------------------------------------------------------------------------
// GET CHALLENGES (LIST) - FILESYSTEM CATALOG + EXPLICIT DB OVERLAY
// ----------------------------------------------------------------------------

const ChallengeCatalogListSchema = z.object({
  locale: z.string().min(1).default('en'),
});

export const getChallenges = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => ChallengeCatalogListSchema.parse(data))
  .handler(async ({ data: { locale } }): Promise<ChallengeListResponse> => {
    try {
      const catalog = await getChallengeCatalogList(locale);
      const slugs = catalog.map((challenge) => challenge.slug);
      const dbRecords = slugs.length
        ? await db
            .select({
              slug: challenges.slug,
              id: challenges.id,
              isPublished: challenges.isPublished,
              completionCount: challenges.completionCount,
            })
            .from(challenges)
            .where(inArray(challenges.slug, slugs))
        : [];
      const dbBySlug = new Map(
        dbRecords.map((record) => [record.slug, record]),
      );

      const headers = getRequest().headers;
      const session = await auth.api.getSession({ headers });
      const progressByChallengeId = new Map<string, boolean>();

      if (session?.user?.id && dbRecords.length > 0) {
        const progressRecords = await db
          .select({
            challengeId: progress.challengeId,
            isCompleted: progress.isCompleted,
          })
          .from(progress)
          .where(
            and(
              eq(progress.userId, session.user.id),
              inArray(
                progress.challengeId,
                dbRecords.map((record) => record.id),
              ),
            ),
          );

        for (const record of progressRecords) {
          if (record.challengeId) {
            progressByChallengeId.set(record.challengeId, record.isCompleted);
          }
        }
      }

      const publishedCatalog = catalog.filter(
        (challenge) => dbBySlug.get(challenge.slug)?.isPublished !== false,
      );
      const data = publishedCatalog.map((challenge) => {
        const dbRecord = dbBySlug.get(challenge.slug);
        return mergeChallengeCatalogOverlay(challenge, {
          slug: challenge.slug,
          ...(dbRecord ? { id: dbRecord.id } : {}),
          isPublished: dbRecord?.isPublished ?? true,
          completionCount: dbRecord?.completionCount ?? 0,
          isCompleted: dbRecord
            ? (progressByChallengeId.get(dbRecord.id) ?? false)
            : false,
        });
      });

      return {
        success: true,
        data,
        pagination: {
          page: 1,
          limit: publishedCatalog.length,
          total: publishedCatalog.length,
          totalPages: 1,
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
// GET CHALLENGE (DETAIL) - FILESYSTEM CATALOG + EXPLICIT DB OVERLAY
// ----------------------------------------------------------------------------

const ChallengeDetailSchema = z.object({
  slug: z.string().min(1),
  locale: z.string().min(1).default('en'),
});

function getSelectorInput(
  value: unknown,
): { selector?: string; xpath?: string } | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  const selector = 'selector' in value ? value.selector : undefined;
  const xpath = 'xpath' in value ? value.xpath : undefined;
  return {
    ...omitUndefined({
      selector: typeof selector === 'string' ? selector : undefined,
      xpath: typeof xpath === 'string' ? xpath : undefined,
    }),
  };
}

export const getChallenge = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => ChallengeDetailSchema.parse(data))
  .handler(async ({ data: { slug, locale } }) => {
    try {
      const challengeContent = await getChallengeCatalogDetail(slug, locale);
      if (!challengeContent) return practiceDetailNotFoundFailure();

      if (challengeContent.tags.includes('coming-soon')) {
        return practiceDetailOperationalFailure(
          'This challenge is coming soon!',
        );
      }

      const dbChallenge = await db.query.challenges.findFirst({
        where: eq(challenges.slug, slug),
        columns: {
          id: true,
          isPublished: true,
          completionCount: true,
        },
      });
      if (dbChallenge && !dbChallenge.isPublished) {
        return practiceDetailNotFoundFailure();
      }

      const processedTestCases = challengeContent.testCases.map(
        (testCase, index) => ({
          id: `tc-${index}`,
          description: testCase.description,
          input: testCase.expectedOutput,
          expectedOutput: testCase.expectedOutput,
          order: index,
          ...omitUndefined({ isHidden: testCase.isHidden }),
        }),
      );

      const visibleTestCases = processedTestCases
        .filter((testCase) => !testCase.isHidden)
        .map((testCase) => {
          if (
            challengeContent.type !== 'CSS_SELECTOR' &&
            challengeContent.type !== 'XPATH_SELECTOR'
          ) {
            return testCase;
          }

          const output = getSelectorInput(testCase.expectedOutput);
          if (output?.selector) {
            return {
              ...testCase,
              input: { selector: obfuscate(output.selector) },
            };
          }
          if (output?.xpath) {
            return { ...testCase, input: { xpath: obfuscate(output.xpath) } };
          }
          return testCase;
        });

      const hiddenTestCaseCount = processedTestCases.filter(
        (testCase) => testCase.isHidden,
      ).length;

      let tutorialData: { slug: string; title: string } | null = null;
      if (challengeContent.tutorialSlug) {
        const tutorial = await getTutorialCatalogDetail(
          challengeContent.tutorialSlug,
          locale,
        );
        if (tutorial)
          tutorialData = { slug: tutorial.slug, title: tutorial.title };
      }

      let userProgressData: {
        isCompleted: boolean;
        attempts: number | null;
        lastAccessedAt: Date;
        usedHint: boolean;
        hintContent: string | null;
      } | null = null;
      let bestSubmissionData: {
        code: string;
        isPassed: boolean;
        xpEarned: number;
        testsPassed: number;
        testsTotal: number;
        executionTime: number | null;
      } | null = null;

      const headers = getRequest().headers;
      const session = await auth.api.getSession({ headers });

      if (session?.user?.id && dbChallenge) {
        const progressRecord = await db.query.progress.findFirst({
          where: and(
            eq(progress.userId, session.user.id),
            eq(progress.challengeId, dbChallenge.id),
          ),
        });

        if (progressRecord) {
          userProgressData = {
            isCompleted: progressRecord.isCompleted,
            attempts: progressRecord.attempts,
            lastAccessedAt: progressRecord.lastAccessedAt,
            usedHint: progressRecord.usedHint,
            hintContent: progressRecord.hintContent,
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

      const allChallenges = await getChallengeCatalogList(locale);
      const currentOrder = challengeContent.order;
      const currentCategory = challengeContent.category;
      const sameCategory = (candidate: (typeof allChallenges)[number]) =>
        candidate.category === currentCategory;
      const nextChallenge =
        allChallenges.find(
          (candidate) =>
            sameCategory(candidate) && candidate.order > currentOrder,
        ) ??
        allChallenges.find((candidate) => candidate.order > currentOrder) ??
        null;
      const prevChallenge =
        [...allChallenges]
          .reverse()
          .find(
            (candidate) =>
              sameCategory(candidate) && candidate.order < currentOrder,
          ) ??
        [...allChallenges]
          .reverse()
          .find((candidate) => candidate.order < currentOrder) ??
        null;

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
          hints: challengeContent.hints,
          ...omitUndefined({
            tutorialSlug: challengeContent.tutorialSlug,
            htmlContent: challengeContent.htmlContent,
            files: challengeContent.files,
            editableFiles: challengeContent.editableFiles,
            preloadModules: challengeContent.preloadModules,
            starterCode: challengeContent.starterCode,
            tags: challengeContent.tags,
            expectedState: challengeContent.expectedState,
            validation: challengeContent.validation,
          }),
          completionCount: dbChallenge?.completionCount || 0,
          tutorial: tutorialData,
          testCases: visibleTestCases,
          hiddenTestCaseCount,
          userProgress: userProgressData,
          bestSubmission: bestSubmissionData,
          nextChallenge: nextChallenge
            ? { slug: nextChallenge.slug, title: nextChallenge.title }
            : null,
          prevChallenge: prevChallenge
            ? { slug: prevChallenge.slug, title: prevChallenge.title }
            : null,
        },
      };
    } catch (error) {
      logger.error('Error fetching challenge detail:', error);
      return practiceDetailOperationalFailure();
    }
  });
