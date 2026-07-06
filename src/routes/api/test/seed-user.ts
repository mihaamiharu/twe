import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';

import { z } from 'zod';

const seedSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1),
});

export async function fetchWithHeaders(url: string, init?: RequestInit) {
  return fetch(url, init);
}

export const Route = createFileRoute('/api/test/seed-user')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          const parsed = seedSchema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: 'Email, password, and name are required', details: parsed.error }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          const { email, password, name } = parsed.data;

          // 1. Wipe if exists
          await db.delete(users).where(eq(users.email, email));

          // 2. We use Better Auth's sign-up internally to correctly hash and salt the password
          // without needing to import their internal crypto utilities.
          const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
          const signupRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email, 
              password, 
              name
            }),
          });

          if (!signupRes.ok) {
            const errBody = await signupRes.text();
            throw new Error(`Better Auth sign-up failed: ${errBody}`);
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Test user seeded successfully via Better Auth' }),
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
