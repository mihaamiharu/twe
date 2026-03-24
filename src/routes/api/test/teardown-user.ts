import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/api/test/teardown-user' as any)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const body = await request.json();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!body.email || typeof body.email !== 'string') {
            return new Response(
              JSON.stringify({ error: 'Valid email is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          await db.delete(users).where(eq(users.email, body.email));

          return new Response(
            JSON.stringify({ success: true, message: 'User torn down completely' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ error: 'Internal Server Error', details: String(e) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    },
  },
});
