import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { tutorials } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const getAdminTutorials = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const list = await db
        .select()
        .from(tutorials)
        .orderBy(tutorials.createdAt);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch tutorials:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateTutorialStatusSchema = z.object({
  id: z.string(),
  isPublished: z.boolean(),
});

export const updateTutorialStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateTutorialStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      await db
        .update(tutorials)
        .set({
          isPublished: input.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(tutorials.id, input.id));

      return { success: true, message: 'Tutorial updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update tutorial:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
