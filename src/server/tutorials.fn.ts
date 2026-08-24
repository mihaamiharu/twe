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
import { checkLevelUp } from '@/lib/gamification';
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

      const nextTutorial = await getNextTutorialCatalogItem(slug, locale);

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
          nextTutorial,
        },
      };
    } catch (error) {
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

export const completeTutorialHandler = async ({
  data: input,
  context,
}: {
  data: z.infer<typeof MarkTutorialCompleteSchema>;
  context?: { user?: { id?: string } } | undefined;
}) => {
  try {
    const userId = context?.user?.id;
    if (!userId) return { success: false, error: 'Unauthorized' };
    const { slug } = input;
    const tutorialContent = await getTutorialCatalogDetail(slug, 'en');

    if (!tutorialContent)
      return { success: false, error: 'Tutorial not found' };

    const existingTutorial = await db.query.tutorials.findFirst({
      where: eq(tutorials.slug, slug),
    });

    if (existingTutorial && !existingTutorial.isPublished) {
      return { success: false, error: 'Tutorial not found' };
    }

    const tutorial =
      existingTutorial ??
      (await ensureEntityInDb({
        slug,
        findExisting: (value) =>
          db.query.tutorials.findFirst({
            where: eq(tutorials.slug, value),
          }),
        fetchContent: () => Promise.resolve(tutorialContent),
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

    const completion = await db.transaction(async (transaction) => {
      // The partial unique index plus this insert prevents concurrent
      // requests from creating two progress rows. The row lock serializes
      // the transition from incomplete to complete and its rewards.
      await transaction
        .insert(progress)
        .values({
          userId,
          tutorialId: tutorial.id,
          isCompleted: false,
          readingProgress: 0,
        })
        .onConflictDoNothing();

      const [progressRecord] = await transaction
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.userId, userId),
            eq(progress.tutorialId, tutorial.id),
          ),
        )
        .for('update');

      if (!progressRecord)
        throw new Error('Failed to initialize tutorial progress');

      const wasAlreadyCompleted = progressRecord.isCompleted;
      let newAchievements: { id: string; name: string; icon: string }[] = [];

      if (!wasAlreadyCompleted) {
        const now = new Date();
        await transaction
          .update(progress)
          .set({
            isCompleted: true,
            readingProgress: 100,
            completedAt: now,
            lastAccessedAt: now,
            updatedAt: now,
          })
          .where(eq(progress.id, progressRecord.id));

        const [user] = await transaction
          .select({ xp: users.xp, level: users.level })
          .from(users)
          .where(eq(users.id, userId))
          .for('update');
        if (!user) throw new Error('User not found');

        const levelUpInfo = checkLevelUp(user.xp, 25);
        await transaction
          .update(users)
          .set({
            xp: user.xp + 25,
            level: levelUpInfo.newLevel,
            updatedAt: now,
          })
          .where(eq(users.id, userId));

        const userStats = await getUserStats(userId, transaction);
        const alreadyEarned = await getEarnedAchievementIds(
          userId,
          transaction,
        );
        const earnedAchievements = checkAchievements(userStats, alreadyEarned);
        const awardedSlugs = await awardAchievements(
          userId,
          earnedAchievements.map((achievement) => achievement.id),
          transaction,
        );
        const awarded = new Set(awardedSlugs);
        newAchievements = earnedAchievements
          .filter((achievement) => awarded.has(achievement.id))
          .map((achievement) => ({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
          }));

        if (newAchievements.length > 0) {
          logger.info(
            `[Achievements] Tutorial completion triggered: ${newAchievements.map((achievement) => achievement.name).join(', ')}`,
          );
        }
      }

      // Preserve the existing view-count behavior, but keep it in the same
      // transaction so a failed completion cannot leave a partial write.
      await transaction
        .update(tutorials)
        .set({ viewCount: sql`${tutorials.viewCount} + 1` })
        .where(eq(tutorials.id, tutorial.id));

      return {
        isCompleted: true,
        xpAwarded: wasAlreadyCompleted ? 0 : 25,
        newAchievements,
      };
    });

    return { success: true, data: completion };
  } catch (error) {
    console.error('Error marking tutorial complete:', error);
    return {
      success: false,
      error: 'An error occurred while processing your request.',
    };
  }
};

export const completeTutorial = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => MarkTutorialCompleteSchema.parse(data))
  .handler(completeTutorialHandler);

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
