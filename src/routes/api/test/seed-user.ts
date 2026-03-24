import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';

// Assuming we should hash passwords utilizing BetterAuth or our own util if inserting manually.
// Actually, it's safer to use better-auth if possible, but Better Auth handles registration 
// via its endpoints. If we are inserting via a test API, we might need BetterAuth's hashing.
// For now, let's just insert standard users - actually for password auth in Better Auth, 
// the password hash is typically stored. 
// A much simpler E2E approach to "seed a user" for Better Auth is to just POST to Better Auth's
// native /api/auth/sign-up endpoint internally! 

export async function fetchWithHeaders(url: string, init?: RequestInit) {
  return fetch(url, init);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/api/test/seed-user' as any)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const body = await request.json();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!body.email || !body.password || !body.name) {
            return new Response(
              JSON.stringify({ error: 'Email, password, and name are required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 1. Wipe if exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          await db.delete(users).where(eq(users.email, body.email));

          // 2. We use Better Auth's sign-up internally to correctly hash and salt the password
          // without needing to import their internal crypto utilities.
          const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
          const signupRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              email: body.email, 
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              password: body.password, 
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              name: body.name
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
