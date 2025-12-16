import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { tutorials, progress, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';

export const Route = createFileRoute('/api/tutorials/$slug/complete')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const session = await auth.api.getSession({ headers: request.headers });

          if (!session?.user?.id) {
            return json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const { slug } = params;
          const userId = session.user.id;

          // Get tutorial
          const tutorial = await db.query.tutorials.findFirst({
            where: eq(tutorials.slug, slug),
          });

          if (!tutorial) {
            return json(
              { success: false, error: 'Tutorial not found' },
              { status: 404 }
            );
          }

          // Check if progress already exists
          const existingProgress = await db.query.progress.findFirst({
            where: and(
              eq(progress.userId, userId),
              eq(progress.tutorialId, tutorial.id)
            ),
          });

          if (existingProgress) {
            // Update existing progress
            await db
              .update(progress)
              .set({
                isCompleted: true,
                completedAt: new Date(),
                readingProgress: 100,
                lastAccessedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(progress.id, existingProgress.id));
          } else {
            // Create new progress record
            await db.insert(progress).values({
              userId,
              tutorialId: tutorial.id,
              isCompleted: true,
              completedAt: new Date(),
              readingProgress: 100,
              lastAccessedAt: new Date(),
            });
          }

          return json({
            success: true,
            message: 'Tutorial marked as complete',
          });
        } catch (error) {
          console.error('Error marking tutorial as complete:', error);
          return json(
            { success: false, error: 'Failed to mark tutorial as complete' },
            { status: 500 }
          );
        }
      },
    },
  },
});
