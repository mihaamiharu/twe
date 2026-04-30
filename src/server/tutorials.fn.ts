import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { authMiddleware } from './auth.mw';
import { auth } from './auth.server';
import { db } from '@/db';
import { tutorials, progress, challenges, users } from '@/db/schema';
import { eq, and, inArray, asc, sql } from 'drizzle-orm';
import {
  getTutorialList,
  getTutorialContent,
  getNextTutorial,
} from './content.server';
import { checkAchievements } from '@/lib/achievements';
import {
  getUserStats,
  getEarnedAchievementIds,
  awardAchievements,
} from '@/lib/stats';
import { logger } from '@/lib/logger';
import { ensureEntityInDb } from './ensure-entity-in-db';

// Helper for localizable fields (still needed for challenges)
const getLocalizedValue = (value: unknown, locale: string): string => {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, string>;
  return obj[locale] || obj['en'] || '';
};

// ----------------------------------------------------------------------------
// GET TUTORIALS (LIST) - NOW USING FILESYSTEM
// ----------------------------------------------------------------------------

const TutorialFiltersSchema = z.object({
  locale: z.string().default('en'),
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().max(50).default(20),
  sortBy: z
    .enum(['order', 'estimatedMinutes', 'viewCount', 'createdAt'])
    .default('order'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getTutorials = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => TutorialFiltersSchema.parse(data))
  .handler(async ({ data: filters }) => {
    try {
      // Load tutorials from filesystem (content service)
      let allTutorials = await getTutorialList(filters.locale);

      // Apply search filter (in-memory since content is from filesystem)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allTutorials = allTutorials.filter(
          (t) =>
            t.title.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower),
        );
      }

      // Apply tag filter
      if (filters.tag) {
        allTutorials = allTutorials.filter((t) => t.tags.includes(filters.tag!));
      }

      // Sort
      allTutorials.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'order':
            comparison = a.order - b.order;
            break;
          case 'estimatedMinutes':
            comparison = a.estimatedMinutes - b.estimatedMinutes;
            break;
          // viewCount and createdAt would need DB lookup
          default:
            comparison = a.order - b.order;
        }
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });

      const total = allTutorials.length;

      // Pagination
      const offset = (filters.page - 1) * filters.limit;
      const paginatedTutorials = allTutorials.slice(
        offset,
        offset + filters.limit,
      );

      // Get DB records for viewCount (optional enhancement)
      const slugs = paginatedTutorials.map((t) => t.slug);
      const dbRecords = await db
        .select({
          slug: tutorials.slug,
          id: tutorials.id,
          viewCount: tutorials.viewCount,
        })
        .from(tutorials)
        .where(inArray(tutorials.slug, slugs));

      const dbBySlug = new Map(dbRecords.map((r) => [r.slug, r]));

      // Get user progress
      let userProgress: Record<
        string,
        { isCompleted: boolean; readingProgress: number }
      > = {};

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (session?.user?.id && dbRecords.length > 0) {
        const tutorialIds = dbRecords.map((r) => r.id);
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
              inArray(progress.tutorialId, tutorialIds),
            ),
          );

        userProgress = progressRecords.reduce(
          (acc, p) => {
            if (p.tutorialId) {
              acc[p.tutorialId] = {
                isCompleted: p.isCompleted,
                readingProgress: p.readingProgress || 0,
              };
            }
            return acc;
          },
          {} as Record<string, { isCompleted: boolean; readingProgress: number }>,
        );
      }

      // Merge filesystem content with DB data
      const tutorialsWithProgress = paginatedTutorials.map((tutorial) => {
        const dbRecord = dbBySlug.get(tutorial.slug);
        return {
          id: dbRecord?.id || tutorial.slug, // Use slug as fallback ID
          slug: tutorial.slug,
          title: tutorial.title,
          description: tutorial.description,
          estimatedMinutes: tutorial.estimatedMinutes,
          tags: tutorial.tags,
          order: tutorial.order,
          viewCount: dbRecord?.viewCount || 0,
          isCompleted: dbRecord
            ? userProgress[dbRecord.id]?.isCompleted || false
            : false,
          readingProgress: dbRecord
            ? userProgress[dbRecord.id]?.readingProgress || 0
            : 0,
        };
      });

      // Get all available tags from registry
      const allTags = [...new Set(allTutorials.flatMap((t) => t.tags))].sort();

      return {
        success: true,
        data: tutorialsWithProgress,
        meta: {
          availableTags: allTags,
        },
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
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
// GET TUTORIAL (DETAIL) - NOW USING FILESYSTEM
// ----------------------------------------------------------------------------

const TutorialDetailSchema = z.object({
  slug: z.string(),
  locale: z.string().default('en'),
});

export const getTutorial = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => TutorialDetailSchema.parse(data))
  .handler(async ({ data: { slug, locale } }) => {
    try {
      // Load tutorial content from filesystem
      const tutorialContent = await getTutorialContent(slug, locale);

      if (!tutorialContent) {
        throw new Error('Tutorial not found');
      }

      // Get DB record for this tutorial (for ID, viewCount, etc.)
      const dbTutorial = await db.query.tutorials.findFirst({
        where: and(eq(tutorials.slug, slug), eq(tutorials.isPublished, true)),
        columns: {
          id: true,
          viewCount: true,
          order: true,
        },
      });

      // Get related challenges from DB (if any)
      let relatedChallenges: Array<{
        slug: string;
        title: string;
        difficulty: string;
        type: string;
        xpReward: number;
        category: string;
      }> = [];

      if (
        tutorialContent.relatedChallenges &&
        tutorialContent.relatedChallenges.length > 0
      ) {
        const challengeRecords = await db
          .select({
            slug: challenges.slug,
            title: challenges.title,
            difficulty: challenges.difficulty,
            type: challenges.type,
            xpReward: challenges.xpReward,
            category: challenges.category,
          })
          .from(challenges)
          .where(
            and(
              inArray(challenges.slug, tutorialContent.relatedChallenges),
              eq(challenges.isPublished, true),
            ),
          )
          .orderBy(asc(challenges.order));

        relatedChallenges = challengeRecords.map((c) => ({
          slug: c.slug,
          title: getLocalizedValue(c.title, locale),
          difficulty: c.difficulty,
          type: c.type,
          xpReward: c.xpReward,
          category: c.category || 'misc',
        }));
      }

      // User progress
      let userProgressData = null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

      // Next Tutorial (efficient O(1) lookup using registry)
      const nextTutorial = await getNextTutorial(slug, locale);

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
          order: tutorialContent.order,
          viewCount: dbTutorial?.viewCount || 0,
          challenges: relatedChallenges,
          userProgress: userProgressData,
          nextTutorial: nextTutorial
            ? {
              slug: nextTutorial.slug,
              title: nextTutorial.title,
            }
            : null,
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
  slug: z.string(),
  locale: z.string().optional(), // Optional for backward compatibility
});

export const completeTutorial = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => MarkTutorialCompleteSchema.parse(data))
  .handler(async ({ data: input, context }) => {
    try {
      const userId = context.user.id;
      const { slug } = input;

      // Get tutorial from DB, or create it from filesystem content
      let tutorial = await db.query.tutorials.findFirst({
        where: eq(tutorials.slug, slug),
      });

      if (!tutorial) {
        tutorial = await ensureEntityInDb({
          slug,
          findExisting: (s) =>
            db.query.tutorials.findFirst({
              where: eq(tutorials.slug, s),
            }),
          fetchContent: (s) => getTutorialContent(s, 'en'),
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
        });

        if (!tutorial) {
          return { success: false, error: 'Tutorial not found' };
        }
      }

      // Check existing progress
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

      // Award XP if first completion (tutorials give 25 XP)
      if (!wasAlreadyCompleted) {
        await db
          .update(users)
          .set({
            xp: sql`${users.xp} + 25`,
          })
          .where(eq(users.id, userId));
      }

      // Check and award achievements (for tutorials and streaks)
      let newAchievements: { id: string; name: string; icon: string }[] = [];
      try {
        const userStats = await getUserStats(userId);
        const alreadyEarned = await getEarnedAchievementIds(userId);
        const earnedAchievements = checkAchievements(userStats, alreadyEarned);

        if (earnedAchievements.length > 0) {
          await awardAchievements(
            userId,
            earnedAchievements.map((a) => a.id),
          );

          newAchievements = earnedAchievements.map((a) => ({
            id: a.id,
            name: a.name,
            icon: a.icon,
          }));

          logger.info(
            `[Achievements] Tutorial completion triggered: ${earnedAchievements.map((a) => a.name).join(', ')}`,
          );
        }
      } catch (error) {
        logger.error('Error checking achievements after tutorial:', error);
      }

      // Increment view/completion count
      await db
        .update(tutorials)
        .set({
          viewCount: sql`${tutorials.viewCount} + 1`,
        })
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
  slug: z.string(),
});

export const incrementTutorialViewCount = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => IncrementViewCountSchema.parse(data))
  .handler(async ({ data: { slug } }) => {
    try {
      await db
        .update(tutorials)
        .set({
          viewCount: sql`${tutorials.viewCount} + 1`,
        })
        .where(eq(tutorials.slug, slug));

      return { success: true };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return { success: false, error: 'Failed to increment view count' };
    }
  });
