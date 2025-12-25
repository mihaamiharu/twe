import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { bugReports } from '@/db/schema';
import { auth } from '@/lib/auth.server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { sendBugReportNotification } from '@/lib/email.server';

// Validation schema for bug report
const bugReportSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    stepsToReproduce: z.string().min(10, 'Please provide steps to reproduce'),
    expectedBehavior: z.string().min(10, 'Please describe the expected behavior'),
    actualBehavior: z.string().min(10, 'Please describe the actual behavior'),
    pageUrl: z.string().url().optional().nullable().or(z.literal('')),
    browserInfo: z.string().optional().nullable(),
    // Transform empty string to null, then optionally validate as email
    email: z.string().transform(val => val === '' ? null : val).nullable().refine(
        val => val === null || z.string().email().safeParse(val).success,
        { message: 'Invalid email address' }
    ).optional(),
});

export const Route = createFileRoute('/api/bug-reports/')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    // Try to get session but don't require it (allow anonymous reports)
                    let userId: string | null = null;
                    let userEmail: string | null = null;

                    try {
                        const session = await auth.api.getSession({ headers: request.headers });
                        userId = session?.user?.id || null;
                        userEmail = session?.user?.email || null;
                    } catch {
                        // Session retrieval failed, continue as anonymous
                    }

                    const body = await request.json();

                    // Validate input
                    const validation = bugReportSchema.safeParse(body);
                    if (!validation.success) {
                        return json(
                            { success: false, error: 'Validation failed', details: validation.error.flatten() },
                            { status: 400 }
                        );
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
                    } = validation.data;

                    // Determine reporter email
                    const reporterEmail = userEmail || email || null;

                    // Create bug report
                    const report = await db
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

                    logger.info(`[BugReport] New bug report created: ${report[0].id} - "${title}" (${severity})`);

                    // Send email notification to admin (non-blocking)
                    sendBugReportNotification({
                        id: report[0].id,
                        title: report[0].title,
                        severity: report[0].severity,
                        stepsToReproduce: report[0].stepsToReproduce,
                        expectedBehavior: report[0].expectedBehavior,
                        actualBehavior: report[0].actualBehavior,
                        pageUrl: report[0].pageUrl,
                        browserInfo: report[0].browserInfo,
                        reporterEmail: report[0].reporterEmail,
                    }).catch((err) => {
                        logger.error('[BugReport] Failed to send admin notification:', err);
                    });

                    return json({
                        success: true,
                        data: {
                            id: report[0].id,
                            title: report[0].title,
                            severity: report[0].severity,
                            status: report[0].status,
                            createdAt: report[0].createdAt,
                        },
                        message: 'Bug report submitted successfully. Thank you for your feedback!',
                    });
                } catch (error) {
                    logger.error('Error creating bug report:', error);
                    return json(
                        { success: false, error: 'Failed to submit bug report' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});

