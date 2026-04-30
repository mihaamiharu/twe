import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { challenges } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const getAdminChallenges = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const list = await db
        .select({
          id: challenges.id,
          slug: challenges.slug,
          title: challenges.title,
          type: challenges.type,
          difficulty: challenges.difficulty,
          xpReward: challenges.xpReward,
          order: challenges.order,
          isPublished: challenges.isPublished,
          tags: challenges.tags,
        })
        .from(challenges)
        .orderBy(challenges.order, challenges.title);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch challenges:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateChallengeStatusSchema = z.object({
  id: z.string(),
  isPublished: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
});

export const updateChallengeStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateChallengeStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      const existing = await db.query.challenges.findFirst({
        where: eq(challenges.id, input.id),
      });

      if (!existing) {
        return { success: false, error: 'Challenge not found' };
      }

      const updateData: Partial<typeof challenges.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.isPublished !== undefined) {
        updateData.isPublished = input.isPublished;
      }

      if (input.isComingSoon !== undefined) {
        let newTags = existing.tags || [];
        if (input.isComingSoon) {
          if (!newTags.includes('coming-soon')) {
            newTags = [...newTags, 'coming-soon'];
          }
        } else {
          newTags = newTags.filter((t) => t !== 'coming-soon');
        }
        updateData.tags = newTags;
      }

      await db
        .update(challenges)
        .set(updateData)
        .where(eq(challenges.id, input.id));

      return { success: true, message: 'Challenge updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update challenge:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
