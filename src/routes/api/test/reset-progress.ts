import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users, progress, submissions, challenges, tutorials } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';
import { z } from 'zod';

const resetSchema = z.object({
  email: z.string().email(),
  type: z.enum(['challenge', 'tutorial']),
  slug: z.string().nullable().optional(),
});

export const Route = createFileRoute('/api/test/reset-progress')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          const parsed = resetSchema.safeParse(await request.json());
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: 'Invalid payload', details: parsed.error }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          const { email, type, slug } = parsed.data;

          // 1. Get User
          const userRecord = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!userRecord) {
            return new Response(
              JSON.stringify({ error: 'User not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const userId = userRecord.id;

          // 2. Perform Resets
          if (type === 'challenge') {
            if (slug) {
              const challengeRecord = await db.query.challenges.findFirst({ where: eq(challenges.slug, slug) });
              if (challengeRecord) {
                await db.delete(progress).where(and(eq(progress.userId, userId), eq(progress.challengeId, challengeRecord.id)));
                await db.delete(submissions).where(and(eq(submissions.userId, userId), eq(submissions.challengeId, challengeRecord.id)));
              }
            } else {
              await db.delete(progress).where(and(eq(progress.userId, userId), isNotNull(progress.challengeId)));
              await db.delete(submissions).where(eq(submissions.userId, userId));
            }
          } else if (type === 'tutorial') {
            if (slug) {
              const tutorialRecord = await db.query.tutorials.findFirst({ where: eq(tutorials.slug, slug) });
              if (tutorialRecord) {
                await db.delete(progress).where(and(eq(progress.userId, userId), eq(progress.tutorialId, tutorialRecord.id)));
              }
            } else {
              await db.delete(progress).where(and(eq(progress.userId, userId), isNotNull(progress.tutorialId)));
            }
          }

          // Also reset XP strictly to 0 if full reset
          if (!slug && type === 'challenge') {
             await db.update(users).set({ xp: 0, level: 1 }).where(eq(users.id, userId));
          }

          return new Response(
            JSON.stringify({ success: true, message: `Reset ${type} progress for ${email}` }),
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
