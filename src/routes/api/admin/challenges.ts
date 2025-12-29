import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges } from '@/db/schema';
import { auth } from '@/lib/auth.server';
import { desc, eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/admin/challenges')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers });

                if (!session?.user || (session.user as any).role !== 'ADMIN') {
                    return json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                try {
                    const list = await db.select({
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

                    return json({ success: true, data: list });
                } catch (error) {
                    console.error('Failed to fetch challenges:', error);
                    return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
                }
            },
            PATCH: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers });

                if (!session?.user || (session.user as any).role !== 'ADMIN') {
                    return json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                try {
                    const body = await request.json();
                    const { id, isPublished, isComingSoon } = body;

                    if (!id) {
                        return json({ success: false, error: 'Challenge ID is required' }, { status: 400 });
                    }

                    const existing = await db.query.challenges.findFirst({
                        where: eq(challenges.id, id),
                    });

                    if (!existing) {
                        return json({ success: false, error: 'Challenge not found' }, { status: 404 });
                    }

                    const updateData: any = {
                        updatedAt: new Date(),
                    };

                    if (isPublished !== undefined) {
                        updateData.isPublished = isPublished;
                    }

                    if (isComingSoon !== undefined) {
                        let newTags = existing.tags || [];
                        if (isComingSoon) {
                            if (!newTags.includes('coming-soon')) {
                                newTags = [...newTags, 'coming-soon'];
                            }
                        } else {
                            newTags = newTags.filter(t => t !== 'coming-soon');
                        }
                        updateData.tags = newTags;
                    }

                    await db.update(challenges)
                        .set(updateData)
                        .where(eq(challenges.id, id));

                    return json({ success: true, message: 'Challenge updated' });
                } catch (error) {
                    console.error('Failed to update challenge:', error);
                    return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
                }
            },
        },
    },
});
