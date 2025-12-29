import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users, submissions } from '@/db/schema';
import { auth } from '@/lib/auth.server';
import { desc, eq, count } from 'drizzle-orm';

export const Route = createFileRoute('/api/admin/users')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user || (session.user as any).role !== 'ADMIN') {
          return json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        try {
          const usersList = await db.select({
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

          return json({ success: true, data: usersList });
        } catch (error) {
          console.error('Failed to fetch users:', error);
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
          const { id, showOnLeaderboard } = body;

          if (!id) {
            return json({ success: false, error: 'User ID is required' }, { status: 400 });
          }

          if (showOnLeaderboard === undefined) {
            return json({ success: false, error: 'showOnLeaderboard status is required' }, { status: 400 });
          }

          await db.update(users)
            .set({
              showOnLeaderboard: showOnLeaderboard,
              updatedAt: new Date()
            })
            .where(eq(users.id, id));

          return json({ success: true, message: 'User updated' });
        } catch (error) {
          console.error('Failed to update user:', error);
          return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
        }
      },
    },
  },
});
