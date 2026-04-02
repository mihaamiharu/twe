import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';
import { z } from 'zod';

const teardownSchema = z.object({
  email: z.string().email(),
});

export const Route = createFileRoute('/api/test/teardown-user')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          const body = teardownSchema.safeParse(await request.json());
          if (!body.success) {
            return new Response(
              JSON.stringify({ error: 'Valid email is required', details: body.error }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await db.delete(users).where(eq(users.email, body.data.email));

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
