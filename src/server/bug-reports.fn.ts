import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { z } from 'zod';
import { db } from '@/db';
import { bugReports } from '@/db/schema';
import { logger } from '@/lib/logger';
import { auth } from './auth.server';
import { optionalAuthMiddleware } from './auth.mw';
import { createGitHubIssue, formatBugReportBody } from './github.server';
import { getEarnedAchievementIds, awardAchievements } from '@/lib/stats';
import { createRateLimitMiddleware } from './rate-limit.mw';

const BugReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  stepsToReproduce: z
    .string()
    .min(10, 'Please provide detailed steps to reproduce the bug'),
  expectedBehavior: z
    .string()
    .min(10, 'Please describe what you expected to happen'),
  actualBehavior: z.string().min(10, 'Please describe what actually happened'),
  pageUrl: z.string().url().optional().nullable().or(z.literal('')),
  browserInfo: z.string().optional().nullable(),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
});

export const createBugReport = createServerFn({ method: 'POST' })
  .middleware([
    optionalAuthMiddleware,
    createRateLimitMiddleware({
      key: 'bug-report',
      limit: 3,
      windowMinutes: 60,
    }),
  ])
  .inputValidator((data: unknown) => BugReportSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();
      let userId: string | null = null;
      let userEmail: string | null = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const session = await auth.api.getSession({ headers });
        userId = session?.user?.id || null;
        userEmail = session?.user?.email || null;
      } catch {
        // Ignore session error, anonymous reports allowed
      }

      const {
        title,
        severity,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        pageUrl,
        browserInfo,
        email,
      } = input;

      // Determine reporter email
      const reporterEmail = userEmail || (email === '' ? null : email) || null;

      // Create bug report
      const [report] = await db
        .insert(bugReports)
        .values({
          userId,
          reporterEmail,
          title,
          severity,
          stepsToReproduce,
          expectedBehavior,
          actualBehavior,
          pageUrl: pageUrl || null,
          browserInfo: browserInfo || null,
        })
        .returning();

      logger.info(
        `[BugReport] New bug report created: ${report.id} - "${title}" (${severity})`,
      );

      // Award Bug Squasher achievement (only for authenticated users, first report only)
      let newAchievement: { id: string; name: string; icon: string } | null = null;
      if (userId) {
        try {
          const alreadyEarned = await getEarnedAchievementIds(userId);
          if (!alreadyEarned.has('bug-squasher')) {
            await awardAchievements(userId, ['bug-squasher']);
            newAchievement = {
              id: 'bug-squasher',
              name: 'Bug Squasher',
              icon: '🐞',
            };
            logger.info(`[Achievements] Bug Squasher awarded to user ${userId}`);
          }
        } catch (error) {
          logger.error('Error awarding Bug Squasher achievement:', error);
        }
      }

      // Create GitHub Issue (non-blocking)
      const issueBody = formatBugReportBody({
        reportId: report.id,
        stepsToReproduce: report.stepsToReproduce,
        expectedBehavior: report.expectedBehavior,
        actualBehavior: report.actualBehavior,
        pageUrl: report.pageUrl,
        browserInfo: report.browserInfo,
        reporterEmail: report.reporterEmail,
        userId: report.userId,
      });

      createGitHubIssue({
        title: `[${report.severity}] ${report.title}`,
        body: issueBody,
        labels: ['bug', report.severity.toLowerCase()],
      }).catch((err) => {
        logger.error('[BugReport] Failed to create GitHub issue:', err);
      });

      return {
        success: true,
        data: {
          id: report.id,
          title: report.title,
          severity: report.severity,
          status: report.status,
          createdAt: report.createdAt,
          newAchievement,
        },
        message:
          'Bug report submitted successfully. Thank you for your feedback!',
      };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Error creating bug report:', error);
      // Don't expose internal errors
      return {
        success: false,
        error: 'Failed to submit bug report',
      };
    }
  });
