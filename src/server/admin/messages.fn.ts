import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const getAdminMessages = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const list = await db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt));

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch messages:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateMessageStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

export const updateMessageStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateMessageStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      await db
        .update(contactMessages)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(contactMessages.id, input.id));

      return { success: true, message: 'Message updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update message:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
