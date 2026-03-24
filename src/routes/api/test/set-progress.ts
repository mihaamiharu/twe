import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { users, progress, submissions, challenges, tutorials } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/api/test/set-progress' as any)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const errorResponse = requireTestEnv(request);
        if (errorResponse) return errorResponse;

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const body = await request.json();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const { email, type, slug, xp = 10 } = body as { email?: string; type?: string; slug?: string; xp?: number };

          if (!email || !type || !slug) {
            return new Response(
              JSON.stringify({ error: 'Email, type, and slug are required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (type !== 'challenge' && type !== 'tutorial') {
            return new Response(
              JSON.stringify({ error: 'Type must be "challenge" or "tutorial"' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const userRecord = await db.query.users.findFirst({ where: eq(users.email, email) });
          if (!userRecord) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }

          const userId = userRecord.id;

          if (type === 'challenge') {
            const challengeRecord = await db.query.challenges.findFirst({ where: eq(challenges.slug, slug) });
            if (!challengeRecord) {
              return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }

            // Insert a fake winning submission
            const newSubmission = await db.insert(submissions).values({
              userId,
              challengeId: challengeRecord.id,
              code: '// seeded via e2e test api',
              isPassed: true,
              xpEarned: xp,
              testsPassed: 1,
              testsTotal: 1,
            }).returning();

            // Upsert progress 
            // Check if progress exists first
            const existingProgress = await db.query.progress.findFirst({
              where: and(eq(progress.userId, userId), eq(progress.challengeId, challengeRecord.id)),
            });

            if (existingProgress) {
              await db.update(progress).set({
                isCompleted: true,
                completedAt: new Date(),
                bestSubmissionId: newSubmission[0].id,
              }).where(eq(progress.id, existingProgress.id));
            } else {
              await db.insert(progress).values({
                userId,
                challengeId: challengeRecord.id,
                isCompleted: true,
                completedAt: new Date(),
                bestSubmissionId: newSubmission[0].id,
              });
            }

            // Grant XP to user
            await db.update(users).set({ xp: userRecord.xp + xp }).where(eq(users.id, userId));

          } else if (type === 'tutorial') {
            const tutorialRecord = await db.query.tutorials.findFirst({ where: eq(tutorials.slug, slug) });
            if (!tutorialRecord) {
              return new Response(JSON.stringify({ error: 'Tutorial not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }

            const existingProgress = await db.query.progress.findFirst({
              where: and(eq(progress.userId, userId), eq(progress.tutorialId, tutorialRecord.id)),
            });

            if (existingProgress) {
              await db.update(progress).set({
                isCompleted: true,
                completedAt: new Date(),
                readingProgress: 100,
              }).where(eq(progress.id, existingProgress.id));
            } else {
              await db.insert(progress).values({
                userId,
                tutorialId: tutorialRecord.id,
                isCompleted: true,
                completedAt: new Date(),
                readingProgress: 100,
              });
            }
          }

          return new Response(
            JSON.stringify({ success: true, message: `Set ${type} progress for ${slug}` }),
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
