import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const BugReportSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    stepsToReproduce: z.string().min(10, 'Please provide detailed steps to reproduce the bug'),
    expectedBehavior: z.string().min(10, 'Please describe what you expected to happen'),
    actualBehavior: z.string().min(10, 'Please describe what actually happened'),
    pageUrl: z.string().url().optional().nullable().or(z.literal('')),
    browserInfo: z.string().optional().nullable(),
    email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

export const createBugReport = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => BugReportSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');
            const { db } = await import('@/db');
            const { bugReports } = await import('@/db/schema');
            const { logger } = await import('@/lib/logger');
            const { sendBugReportNotification } = await import('@/lib/email.server');

            const headers = getRequestHeaders();
            let userId: string | null = null;
            let userEmail: string | null = null;

            try {
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

            logger.info(`[BugReport] New bug report created: ${report.id} - "${title}" (${severity})`);

            // Send email notification to admin (non-blocking)
            sendBugReportNotification({
                id: report.id,
                title: report.title,
                severity: report.severity,
                stepsToReproduce: report.stepsToReproduce,
                expectedBehavior: report.expectedBehavior,
                actualBehavior: report.actualBehavior,
                pageUrl: report.pageUrl,
                browserInfo: report.browserInfo,
                reporterEmail: report.reporterEmail,
            }).catch((err) => {
                logger.error('[BugReport] Failed to send admin notification:', err);
            });

            return {
                success: true,
                data: {
                    id: report.id,
                    title: report.title,
                    severity: report.severity,
                    status: report.status,
                    createdAt: report.createdAt,
                },
                message: 'Bug report submitted successfully. Thank you for your feedback!',
            };

        } catch (error) {
            console.error('Error creating bug report:', error);
            // Don't expose internal errors
            return {
                success: false,
                error: 'Failed to submit bug report',
            };
        }
    });
