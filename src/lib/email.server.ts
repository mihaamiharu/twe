/**
 * Email Service - Gmail SMTP with Nodemailer
 * 
 * Features:
 * - Email verification for new registrations
 * - Bug report notifications to admin
 * - Password reset emails (future)
 */

import nodemailer from 'nodemailer';


// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
};

// Get sender address
const getFromAddress = () => {
    return process.env.SMTP_FROM || `TestingWithEkki <${process.env.SMTP_USER}>`;
};

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(
    to: string,
    verificationUrl: string,
    userName?: string
): Promise<void> {
    const transporter = createTransporter();

    const appName = 'TestingWithEkki';
    const subject = `Verify your ${appName} account`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #6366f1; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #5558e3; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .url { word-break: break-all; color: #6366f1; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ ${appName}</h1>
        </div>
        <div class="content">
            <h2>Welcome${userName ? `, ${userName}` : ''}! 👋</h2>
            <p>Thank you for signing up for ${appName}. Please verify your email address to get started.</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="url">${verificationUrl}</p>
            
            <p>This link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>Learn testing skills through interactive tutorials and challenges.</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Welcome${userName ? ', ' + userName : ''}!

Thank you for signing up for ${appName}. Please verify your email address to get started.

Click this link to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, you can safely ignore this email.

---
${appName}
    `;

    try {
        await transporter.sendMail({
            from: getFromAddress(),
            to,
            subject,
            text,
            html,
        });
        console.log(`[Email] Verification email sent to ${to}`);
    } catch (error) {
        console.error('[Email] Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

/**
 * Send bug report notification to admin
 */
export async function sendBugReportNotification(report: {
    id: string;
    title: string;
    severity: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualBehavior: string;
    pageUrl?: string | null;
    browserInfo?: string | null;
    reporterEmail?: string | null;
}): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.log('[Email] No ADMIN_EMAIL configured, skipping bug report notification');
        return;
    }

    const transporter = createTransporter();

    const severityEmoji = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢',
    }[report.severity] || '⚪';

    const subject = `${severityEmoji} [Bug Report] ${report.title}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .critical { background: #fee2e2; color: #dc2626; }
        .high { background: #ffedd5; color: #ea580c; }
        .medium { background: #fef3c7; color: #ca8a04; }
        .low { background: #dcfce7; color: #16a34a; }
        .section { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
        .section h3 { margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase; }
        .section pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
        .meta { font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐛 New Bug Report</h1>
        </div>
        <div class="content">
            <h2>${report.title}</h2>
            <p>
                <span class="badge ${report.severity.toLowerCase()}">${severityEmoji} ${report.severity}</span>
            </p>
            
            <div class="section">
                <h3>Steps to Reproduce</h3>
                <pre>${report.stepsToReproduce}</pre>
            </div>
            
            <div class="section">
                <h3>Expected Behavior</h3>
                <pre>${report.expectedBehavior}</pre>
            </div>
            
            <div class="section">
                <h3>Actual Behavior</h3>
                <pre>${report.actualBehavior}</pre>
            </div>
            
            <div class="meta">
                <p><strong>Report ID:</strong> ${report.id}</p>
                ${report.pageUrl ? `<p><strong>Page URL:</strong> ${report.pageUrl}</p>` : ''}
                ${report.reporterEmail ? `<p><strong>Reporter:</strong> ${report.reporterEmail}</p>` : '<p><strong>Reporter:</strong> Anonymous</p>'}
                ${report.browserInfo ? `<p><strong>Browser:</strong> ${report.browserInfo}</p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: getFromAddress(),
            to: adminEmail,
            subject,
            html,
        });
        console.log(`[Email] Bug report notification sent to admin: ${report.id}`);
    } catch (error) {
        console.error('[Email] Failed to send bug report notification:', error);
        // Don't throw - this is a notification, not critical
    }
}
