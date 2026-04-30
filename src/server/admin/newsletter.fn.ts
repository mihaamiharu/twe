import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const getAdminSubscribers = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const list = await db
        .select()
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.createdAt));

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch subscribers:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateSubscriberStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'UNSUBSCRIBED']),
});

export const updateSubscriberStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateSubscriberStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      await db
        .update(newsletterSubscribers)
        .set({
          status: input.status,
          updatedAt: new Date(),
          confirmedAt:
            input.status === 'CONFIRMED' ? new Date() : undefined,
        })
        .where(eq(newsletterSubscribers.id, input.id));

      return { success: true, message: 'Subscriber updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update subscriber:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
