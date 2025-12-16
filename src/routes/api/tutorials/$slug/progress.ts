import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { tutorials, progress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';

export const Route = createFileRoute('/api/tutorials/$slug/progress')({
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
                    const body = await request.json();
                    const { readingProgress } = body;

                    if (typeof readingProgress !== 'number' || readingProgress < 0 || readingProgress > 100) {
                        return json(
                            { success: false, error: 'Invalid reading progress value' },
                            { status: 400 }
                        );
                    }

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
                                readingProgress,
                                lastAccessedAt: new Date(),
                                updatedAt: new Date(),
                            })
                            .where(eq(progress.id, existingProgress.id));
                    } else {
                        // Create new progress record
                        await db.insert(progress).values({
                            userId,
                            tutorialId: tutorial.id,
                            isCompleted: readingProgress >= 100,
                            completedAt: readingProgress >= 100 ? new Date() : null,
                            readingProgress,
                            lastAccessedAt: new Date(),
                        });
                    }

                    return json({
                        success: true,
                        data: { readingProgress },
                    });
                } catch (error) {
                    console.error('Error updating tutorial progress:', error);
                    return json(
                        { success: false, error: 'Failed to update tutorial progress' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});
