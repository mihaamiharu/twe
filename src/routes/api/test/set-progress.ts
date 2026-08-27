import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import {
  users,
  progress,
  submissions,
  challenges,
  tutorials,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireTestEnv } from '@/server/test-env.server';
import { z } from 'zod';

const setProgressSchema = z.object({
  email: z.string().email(),
  type: z.enum(['challenge', 'tutorial']),
  slug: z.string(),
  xp: z.number().optional().default(10),
});

export async function handleSetProgressRequest(
  request: Request,
): Promise<Response> {
  const errorResponse = requireTestEnv(request);
  if (errorResponse) return errorResponse;

  try {
    const parsed = setProgressSchema.safeParse(await request.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', details: parsed.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { email, type, slug, xp } = parsed.data;
    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!userRecord) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = userRecord.id;

    if (type === 'challenge') {
      const challengeRecord = await db.query.challenges.findFirst({
        where: eq(challenges.slug, slug),
      });
      if (!challengeRecord) {
        return new Response(JSON.stringify({ error: 'Challenge not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const [newSubmission] = await db
        .insert(submissions)
        .values({
          userId,
          challengeId: challengeRecord.id,
          code: '// seeded via e2e test api',
          isPassed: true,
          xpEarned: xp,
          testsPassed: 1,
          testsTotal: 1,
        })
        .returning();
      if (!newSubmission) {
        throw new Error('Failed to create progress submission');
      }

      const existingProgress = await db.query.progress.findFirst({
        where: and(
          eq(progress.userId, userId),
          eq(progress.challengeId, challengeRecord.id),
        ),
      });

      if (existingProgress) {
        await db
          .update(progress)
          .set({
            isCompleted: true,
            completedAt: new Date(),
            bestSubmissionId: newSubmission.id,
          })
          .where(eq(progress.id, existingProgress.id));
      } else {
        await db.insert(progress).values({
          userId,
          challengeId: challengeRecord.id,
          isCompleted: true,
          completedAt: new Date(),
          bestSubmissionId: newSubmission.id,
        });
      }

      await db
        .update(users)
        .set({ xp: userRecord.xp + xp })
        .where(eq(users.id, userId));
    } else {
      const tutorialRecord = await db.query.tutorials.findFirst({
        where: eq(tutorials.slug, slug),
      });
      if (!tutorialRecord) {
        return new Response(JSON.stringify({ error: 'Tutorial not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existingProgress = await db.query.progress.findFirst({
        where: and(
          eq(progress.userId, userId),
          eq(progress.tutorialId, tutorialRecord.id),
        ),
      });

      if (existingProgress) {
        await db
          .update(progress)
          .set({
            isCompleted: true,
            completedAt: new Date(),
          })
          .where(eq(progress.id, existingProgress.id));
      } else {
        await db.insert(progress).values({
          userId,
          tutorialId: tutorialRecord.id,
          isCompleted: true,
          completedAt: new Date(),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Set ${type} progress for ${slug}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export const Route = createFileRoute('/api/test/set-progress')({
  server: {
    handlers: {
      POST: ({ request }) => handleSetProgressRequest(request),
    },
  },
});
