import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { authMiddleware } from './auth.mw';
import { auth } from './auth.server';
import { db } from '@/db';
import { tutorials, progress, users } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  getChallengeCatalogList,
  getNextTutorialCatalogItem,
  getPreviousTutorialCatalogItem,
  getTutorialCatalogList,
  getTutorialCatalogDetail,
} from './content-catalog.server';
import { mergeTutorialCatalogOverlay } from '@/lib/catalog-overlays';
import type {
  ChallengeCatalogListItem,
  TutorialListResponse,
} from '@/lib/catalog.types';
import { checkAchievements } from '@/lib/achievements';
import {
  getUserStats,
  getEarnedAchievementIds,
  awardAchievements,
} from '@/lib/stats';
import { logger } from '@/lib/logger';
import { ensureEntityInDb } from './ensure-entity-in-db';

// ----------------------------------------------------------------------------
// GET TUTORIALS (LIST) - FILESYSTEM CATALOG + EXPLICIT DB OVERLAY
// ----------------------------------------------------------------------------

const TutorialCatalogListSchema = z.object({
  locale: z.string().min(1).default('en'),
});

export const getTutorials = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => TutorialCatalogListSchema.parse(data))
  .handler(async ({ data: { locale } }): Promise<TutorialListResponse> => {
    try {
      const catalog = await getTutorialCatalogList(locale);
      const slugs = catalog.map((tutorial) => tutorial.slug);
      const dbRecords = slugs.length
        ? await db
            .select({
              slug: tutorials.slug,
              id: tutorials.id,
              isPublished: tutorials.isPublished,
              viewCount: tutorials.viewCount,
            })
            .from(tutorials)
            .where(inArray(tutorials.slug, slugs))
        : [];
      const dbBySlug = new Map(
        dbRecords.map((record) => [record.slug, record]),
      );

      const headers = getRequest().headers;
      const session = await auth.api.getSession({ headers });
      const progressByTutorialId = new Map<
        string,
        { isCompleted: boolean; readingProgress: number }
      >();

      if (session?.user?.id && dbRecords.length > 0) {
        const progressRecords = await db
          .select({
            tutorialId: progress.tutorialId,
            isCompleted: progress.isCompleted,
            readingProgress: progress.readingProgress,
          })
          .from(progress)
          .where(
            and(
              eq(progress.userId, session.user.id),
              inArray(
                progress.tutorialId,
                dbRecords.map((record) => record.id),
              ),
            ),
          );

        for (const record of progressRecords) {
          if (record.tutorialId) {
            progressByTutorialId.set(record.tutorialId, {
              isCompleted: record.isCompleted,
              readingProgress: record.readingProgress || 0,
            });
          }
        }
      }

      const publishedCatalog = catalog.filter(
        (tutorial) => dbBySlug.get(tutorial.slug)?.isPublished !== false,
      );
      const data = publishedCatalog.map((tutorial) => {
        const dbRecord = dbBySlug.get(tutorial.slug);
        const progressRecord = dbRecord
          ? progressByTutorialId.get(dbRecord.id)
          : undefined;

        return mergeTutorialCatalogOverlay(tutorial, {
          slug: tutorial.slug,
          ...(dbRecord ? { id: dbRecord.id } : {}),
          isPublished: dbRecord?.isPublished ?? true,
          viewCount: dbRecord?.viewCount ?? 0,
          isCompleted: progressRecord?.isCompleted ?? false,
          readingProgress: progressRecord?.readingProgress ?? 0,
        });
      });

      return {
        success: true,
        data,
        meta: {
          availableTags: [
            ...new Set(publishedCatalog.flatMap((item) => item.tags)),
          ].sort(),
        },
        pagination: {
          page: 1,
          limit: publishedCatalog.length,
          total: publishedCatalog.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      return {
        success: false,
        error: 'An error occurred while processing your request.',
      };
    }
  });

// ----------------------------------------------------------------------------
// GET TUTORIAL (DETAIL) - FILESYSTEM CATALOG + EXPLICIT DB OVERLAY
// ----------------------------------------------------------------------------

const TutorialDetailSchema = z.object({
  slug: z.string().min(1),
  locale: z.string().min(1).default('en'),
});

export const getTutorial = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => TutorialDetailSchema.parse(data))
  .handler(async ({ data: { slug, locale } }) => {
    try {
      const tutorialContent = await getTutorialCatalogDetail(slug, locale);
      if (!tutorialContent) throw new Error('Tutorial not found');

      const dbTutorial = await db.query.tutorials.findFirst({
        where: eq(tutorials.slug, slug),
        columns: {
          id: true,
          isPublished: true,
          viewCount: true,
        },
      });
      if (dbTutorial && !dbTutorial.isPublished) {
        throw new Error('Tutorial not found');
      }

      const challengeCatalog = await getChallengeCatalogList(locale);
      const challengeBySlug = new Map(
        challengeCatalog.map((challenge) => [challenge.slug, challenge]),
      );
      const relatedChallenges = tutorialContent.relatedChallenges
        .map((challengeSlug) => challengeBySlug.get(challengeSlug))
        .filter(
          (challenge): challenge is ChallengeCatalogListItem =>
            challenge !== undefined,
        )
        .map((challenge) => ({
          slug: challenge.slug,
          title: challenge.title,
          difficulty: challenge.difficulty,
          type: challenge.type,
          xpReward: challenge.xpReward,
          category: challenge.category,
        }));

      let userProgressData: {
        isCompleted: boolean;
        readingProgress: number | null;
        lastAccessedAt: Date | null;
      } | null = null;

      const headers = getRequest().headers;
      const session = await auth.api.getSession({ headers });

      if (session?.user?.id && dbTutorial) {
        const progressRecord = await db.query.progress.findFirst({
          where: and(
            eq(progress.userId, session.user.id),
            eq(progress.tutorialId, dbTutorial.id),
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

      const [nextTutorial, previousTutorial] = await Promise.all([
        getNextTutorialCatalogItem(slug, locale),
        getPreviousTutorialCatalogItem(slug, locale),
      ]);

      return {
        success: true,
        data: {
          id: dbTutorial?.id || slug,
          slug: tutorialContent.slug,
          title: tutorialContent.title,
          description: tutorialContent.description,
          content: tutorialContent.content,
          estimatedMinutes: tutorialContent.estimatedMinutes,
          tags: tutorialContent.tags,
          relatedChallenges: tutorialContent.relatedChallenges,
          order: tutorialContent.order,
          viewCount: dbTutorial?.viewCount || 0,
          challenges: relatedChallenges,
          userProgress: userProgressData,
          previousTutorial,
          nextTutorial,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Tutorial not found') {
        return { success: false, error: 'Tutorial not found' };
      }
      console.error('Error fetching tutorial detail:', error);
      return {
        success: false,
        error: 'An error occurred while processing your request.',
      };
    }
  });

// NOTE: Reading progress is tracked client-side only.
// Progress is saved to DB only when user clicks "Complete" via completeTutorial().

// ----------------------------------------------------------------------------
// MARK TUTORIAL COMPLETE
// ----------------------------------------------------------------------------

const MarkTutorialCompleteSchema = z.object({
  slug: z.string().min(1),
  locale: z.string().optional(),
});

export const completeTutorial = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => MarkTutorialCompleteSchema.parse(data))
  .handler(async ({ data: input, context }) => {
    try {
      const userId = context.user.id;
      const { slug } = input;

      const existingTutorial = await db.query.tutorials.findFirst({
        where: eq(tutorials.slug, slug),
      });

      const tutorial =
        existingTutorial ??
        (await ensureEntityInDb({
          slug,
          findExisting: (value) =>
            db.query.tutorials.findFirst({
              where: eq(tutorials.slug, value),
            }),
          fetchContent: (value) => getTutorialCatalogDetail(value, 'en'),
          insert: async (tutorialContent) =>
            (
              await db
                .insert(tutorials)
                .values({
                  slug: tutorialContent.slug,
                  title: {
                    en: tutorialContent.title,
                    id: tutorialContent.title,
                  },
                  order: tutorialContent.order,
                  estimatedMinutes: tutorialContent.estimatedMinutes,
                  tags: tutorialContent.tags,
                  isPublished: true,
                })
                .returning()
            )[0],
          logger,
        }));

      if (!tutorial) return { success: false, error: 'Tutorial not found' };

      const existingProgress = await db.query.progress.findFirst({
        where: and(
          eq(progress.userId, userId),
          eq(progress.tutorialId, tutorial.id),
        ),
      });

      let wasAlreadyCompleted = false;
      if (existingProgress) {
        wasAlreadyCompleted = existingProgress.isCompleted;
        if (!wasAlreadyCompleted) {
          await db
            .update(progress)
            .set({
              isCompleted: true,
              readingProgress: 100,
              completedAt: new Date(),
              lastAccessedAt: new Date(),
            })
            .where(eq(progress.id, existingProgress.id));
        }
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

      if (!wasAlreadyCompleted) {
        await db
          .update(users)
          .set({ xp: sql`${users.xp} + 25` })
          .where(eq(users.id, userId));
      }

      let newAchievements: { id: string; name: string; icon: string }[] = [];
      try {
        const userStats = await getUserStats(userId);
        const alreadyEarned = await getEarnedAchievementIds(userId);
        const earnedAchievements = checkAchievements(userStats, alreadyEarned);

        if (earnedAchievements.length > 0) {
          await awardAchievements(
            userId,
            earnedAchievements.map((achievement) => achievement.id),
          );
          newAchievements = earnedAchievements.map((achievement) => ({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
          }));
          logger.info(
            `[Achievements] Tutorial completion triggered: ${earnedAchievements.map((achievement) => achievement.name).join(', ')}`,
          );
        }
      } catch (error) {
        logger.error('Error checking achievements after tutorial:', error);
      }

      await db
        .update(tutorials)
        .set({ viewCount: sql`${tutorials.viewCount} + 1` })
        .where(eq(tutorials.id, tutorial.id));

      return {
        success: true,
        data: {
          isCompleted: true,
          xpAwarded: wasAlreadyCompleted ? 0 : 25,
          newAchievements,
        },
      };
    } catch (error) {
      console.error('Error marking tutorial complete:', error);
      return {
        success: false,
        error: 'An error occurred while processing your request.',
      };
    }
  });

// ----------------------------------------------------------------------------
// INCREMENT VIEW COUNT
// ----------------------------------------------------------------------------

const IncrementViewCountSchema = z.object({
  slug: z.string().min(1),
});

export const incrementTutorialViewCount = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => IncrementViewCountSchema.parse(data))
  .handler(async ({ data: { slug } }) => {
    try {
      await db
        .update(tutorials)
        .set({ viewCount: sql`${tutorials.viewCount} + 1` })
        .where(eq(tutorials.slug, slug));
      return { success: true };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return { success: false, error: 'Failed to increment view count' };
    }
  });
