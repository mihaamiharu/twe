import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { bugReports } from '@/db/schema';
import { auth } from '@/lib/auth.server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const Route = createFileRoute('/api/admin/bugs')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers });

                if (!session?.user || (session.user as any).role !== 'ADMIN') {
                    return json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }

                try {
                    const bugs = await db.query.bugReports.findMany({
                        orderBy: (bugReports, { desc }) => [desc(bugReports.createdAt)],
                        with: {
                            user: {
                                columns: {
                                    name: true,
                                    email: true,
                                    image: true,
                                },
                            },
                        },
                    });

                    return json({ success: true, data: bugs });
                } catch (error) {
                    console.error('Failed to fetch bug reports:', error);
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
                    const { id, status, adminNotes } = body;

                    if (!id) {
                        return json({ success: false, error: 'Bug ID is required' }, { status: 400 });
                    }

                    await db.update(bugReports)
                        .set({
                            ...(status ? { status } : {}),
                            ...(adminNotes !== undefined ? { adminNotes } : {}),
                            updatedAt: new Date()
                        })
                        .where(eq(bugReports.id, id));

                    return json({ success: true, message: 'Bug report updated' });
                } catch (error) {
                    console.error('Failed to update bug report:', error);
                    return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
                }
            },
        },
    },
});
