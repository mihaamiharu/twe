import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, testCases, progress, submissions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { authClient } from '@/lib/auth.client';

export const Route = createFileRoute('/api/challenges/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { slug } = params;

          if (!slug) {
            return json(
              { success: false, error: 'Challenge slug is required' },
              { status: 400 }
            );
          }

          // Get challenge by slug
          const challenge = await db.query.challenges.findFirst({
            where: and(
              eq(challenges.slug, slug),
              eq(challenges.isPublished, true)
            ),
          });

          if (!challenge) {
            return json(
              { success: false, error: 'Challenge not found' },
              { status: 404 }
            );
          }

          // Get visible test cases (non-hidden)
          const visibleTestCases = await db
            .select({
              id: testCases.id,
              description: testCases.description,
              input: testCases.input,
              expectedOutput: testCases.expectedOutput,
              order: testCases.order,
            })
            .from(testCases)
            .where(
              and(
                eq(testCases.challengeId, challenge.id),
                eq(testCases.isHidden, false)
              )
            )
            .orderBy(asc(testCases.order));

          // Get hidden test case count (for display purposes)
          const hiddenTestCases = await db
            .select({ id: testCases.id })
            .from(testCases)
            .where(
              and(
                eq(testCases.challengeId, challenge.id),
                eq(testCases.isHidden, true)
              )
            );

          // Get user progress and submissions if authenticated
          let userProgress = null;
          let bestSubmission = null;

          try {
            const session = await authClient.getSession();
            if (session.data?.user?.id) {
              const userId = session.data.user.id;

              // Get progress
              const progressRecord = await db.query.progress.findFirst({
                where: and(
                  eq(progress.userId, userId),
                  eq(progress.challengeId, challenge.id)
                ),
              });

              if (progressRecord) {
                userProgress = {
                  isCompleted: progressRecord.isCompleted,
                  attempts: progressRecord.attempts,
                  lastAccessedAt: progressRecord.lastAccessedAt,
                };

                // Get best submission if exists
                if (progressRecord.bestSubmissionId) {
                  const submission = await db.query.submissions.findFirst({
                    where: eq(submissions.id, progressRecord.bestSubmissionId),
                  });

                  if (submission) {
                    bestSubmission = {
                      code: submission.code,
                      isPassed: submission.isPassed,
                      xpEarned: submission.xpEarned,
                      testsPassed: submission.testsPassed,
                      testsTotal: submission.testsTotal,
                      executionTime: submission.executionTime,
                    };
                  }
                }
              }
            }
          } catch {
            // User not authenticated, continue without progress
          }

          return json({
            success: true,
            data: {
              id: challenge.id,
              slug: challenge.slug,
              title: challenge.title,
              description: challenge.description,
              type: challenge.type,
              difficulty: challenge.difficulty,
              xpReward: challenge.xpReward,
              instructions: challenge.instructions,
              htmlContent: challenge.htmlContent,
              starterCode: challenge.starterCode,
              hints: challenge.hints,
              tags: challenge.tags,
              completionCount: challenge.completionCount,
              testCases: visibleTestCases,
              hiddenTestCaseCount: hiddenTestCases.length,
              userProgress,
              bestSubmission,
            },
          });
        } catch (error) {
          console.error('Error fetching challenge:', error);
          return json(
            { success: false, error: 'Failed to fetch challenge' },
            { status: 500 }
          );
        }
      },
    },
  },
});
