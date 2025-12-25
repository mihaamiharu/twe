      },
    },
  },
});
import { logger } from '@/lib/logger';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, testCases, progress, submissions } from '@/db/schema';
import { eq, and, asc, gt } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';

export const Route = createFileRoute('/api/challenges/$slug')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
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
            with: {
              tutorial: {
                columns: {
                  slug: true,
                  title: true,
                },
              },
            },
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
            const session = await auth.api.getSession({ headers: request.headers });
            if (session?.user?.id) {
              const userId = session.user.id;

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

          // Get next challenge
          const nextChallenge = await db.query.challenges.findFirst({
            where: and(
              eq(challenges.isPublished, true),
              eq(challenges.category, challenge.category || ''), // Prefer same category
              // Use order > current order
              challenge.order !== null ? gt(challenges.order, challenge.order) : undefined
            ),
            orderBy: asc(challenges.order),
            columns: {
              slug: true,
              title: true,
            },
          });

          // Fallback: If no next challenge in category, find first of next category (by order)
          let finalNextChallenge = nextChallenge;
          if (!finalNextChallenge) {
            finalNextChallenge = await db.query.challenges.findFirst({
              where: and(
                eq(challenges.isPublished, true),
                challenge.order !== null ? gt(challenges.order, challenge.order) : undefined
              ),
              orderBy: asc(challenges.order),
              columns: {
                slug: true,
                title: true,
              }
            });
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
              category: challenge.category,
              tags: challenge.tags,
              completionCount: challenge.completionCount,
              testCases: visibleTestCases,
              hiddenTestCaseCount: hiddenTestCases.length,
              userProgress,
              bestSubmission,
              nextChallenge: finalNextChallenge ? {
                slug: finalNextChallenge.slug,
                title: finalNextChallenge.title
              } : null,
            },
          });
        } catch (error) {
          logger.error('Error fetching challenge:', error);
          return json(
            { success: false, error: 'Failed to fetch challenge' },
            { status: 500 }
          );
        }
      },
    },
  },
});
