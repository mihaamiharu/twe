import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { users, submissions, progress } from '@/db/schema';
import { count, desc, eq } from 'drizzle-orm';

export const getAdminUsers = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const usersList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          showOnLeaderboard: users.showOnLeaderboard,
          submissionCount: count(submissions.id),
        })
        .from(users)
        .leftJoin(submissions, eq(users.id, submissions.userId))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt));

      return { success: true, data: usersList };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch users:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data: { userId } }) => {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return { success: true, message: 'User deleted successfully' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to delete user:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateUserStatusSchema = z.object({
  id: z.string(),
  showOnLeaderboard: z.boolean(),
});

export const updateUserStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateUserStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      await db
        .update(users)
        .set({
          showOnLeaderboard: input.showOnLeaderboard,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));

      return { success: true, message: 'User updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update user:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

export const getAdminUserDetail = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string() }).parse(data),
  )
  .handler(async ({ data: input }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
        with: {
          submissions: {
            orderBy: desc(submissions.createdAt),
            limit: 20,
            with: {
              challenge: {
                columns: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!user) return { success: false, error: 'User not found' };

      const userProgress = await db
        .select({
          isCompleted: progress.isCompleted,
        })
        .from(progress)
        .where(eq(progress.userId, input.userId));

      const completedChallengeCount = userProgress.filter(p => p.isCompleted).length;

      return {
        success: true,
        data: {
          ...user,
          progressCount: userProgress.length,
          completedChallengeCount,
        },
      };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch user detail:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
