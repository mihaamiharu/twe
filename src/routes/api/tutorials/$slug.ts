import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { tutorials, progress, challenges } from '@/db/schema';
import { eq, and, gt, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';

export const Route = createFileRoute('/api/tutorials/$slug')({
    server: {
        handlers: {
            GET: async ({ params, request }) => {
                try {
                    const { slug } = params;

                    if (!slug) {
                        return json(
                            { success: false, error: 'Tutorial slug is required' },
                            { status: 400 }
                        );
                    }

                    // Get tutorial by slug
                    const tutorial = await db.query.tutorials.findFirst({
                        where: and(
                            eq(tutorials.slug, slug),
                            eq(tutorials.isPublished, true)
                        ),
                        with: {
                            challenges: {
                                columns: {
                                    slug: true,
                                    title: true,
                                    difficulty: true,
                                    type: true,
                                    xpReward: true,
                                    category: true,
                                },
                                where: eq(challenges.isPublished, true),
                                orderBy: asc(challenges.order),
                            },
                        },
                    });

                    if (!tutorial) {
                        return json(
                            { success: false, error: 'Tutorial not found' },
                            { status: 404 }
                        );
                    }

                    // Get user progress if authenticated
                    let userProgress = null;
                    try {
                        const session = await auth.api.getSession({ headers: request.headers });
                        if (session?.user?.id) {
                            const progressRecord = await db.query.progress.findFirst({
                                where: and(
                                    eq(progress.userId, session.user.id),
                                    eq(progress.tutorialId, tutorial.id)
                                ),
                            });

                            if (progressRecord) {
                                userProgress = {
                                    isCompleted: progressRecord.isCompleted,
                                    readingProgress: progressRecord.readingProgress,
                                    lastAccessedAt: progressRecord.lastAccessedAt,
                                };
                            }
                        }
                    } catch {
                        // User not authenticated, continue without progress
                    }

                    // Get next tutorial
                    const nextTutorial = await db.query.tutorials.findFirst({
                        where: and(
                            eq(tutorials.isPublished, true),
                            // Use order > current order
                            tutorial.order !== null ? gt(tutorials.order, tutorial.order) : undefined
                        ),
                        orderBy: asc(tutorials.order),
                        columns: {
                            slug: true,
                            title: true,
                        },
                    });

                    return json({
                        success: true,
                        data: {
                            ...tutorial,
                            userProgress,
                            nextTutorial: nextTutorial ? {
                                slug: nextTutorial.slug,
                                title: nextTutorial.title
                            } : null,
                        },
                    });
                } catch (error) {
                    console.error('Error fetching tutorial:', error);
                    return json(
                        { success: false, error: 'Failed to fetch tutorial' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});
