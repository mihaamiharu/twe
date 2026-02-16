/**
 * Email Service - Gmail SMTP with Nodemailer
 *
 * Features:
 * - Email verification for new registrations
 * - Bug report notifications to admin
 * - Password reset emails (future)
 */

import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
  userName?: string,
): Promise<void> {
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
    logger.info(`[Email] Verification email sent to ${to}`);
  } catch (error) {
    logger.error('[Email] Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string,
): Promise<void> {
  const appName = 'TestingWithEkki';
  const subject = `Reset your ${appName} password`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #ef4444; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #dc2626; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .url { word-break: break-all; color: #ef4444; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello${userName ? `, ${userName}` : ''}!</h2>
            <p>We received a request to reset your password for your ${appName} account.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="url">${resetUrl}</p>
            
            <div class="warning">
                ⏰ This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
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
Hello${userName ? ', ' + userName : ''}!

We received a request to reset your password for your ${appName} account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

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
    logger.info(`[Email] Password reset email sent to ${to}`);
  } catch (error) {
    logger.error('[Email] Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
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
    logger.info(
      '[Email] No ADMIN_EMAIL configured, skipping bug report notification',
    );
    return;
  }

  const severityEmoji =
    {
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
    logger.info(`[Email] Bug report notification sent to admin: ${report.id}`);
  } catch (error) {
    logger.error('[Email] Failed to send bug report notification:', error);
    // Don't throw - this is a notification, not critical
  }
}

/**
 * Send newsletter confirmation email
 */
export async function sendNewsletterConfirmationEmail(
  to: string,
  token: string,
): Promise<void> {
  const appName = 'TestingWithEkki';
  const subject = `Confirm your ${appName} subscription`;

  // Use environment variable for base URL if available, otherwise default to production
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://testingwithekki.com';
  // Check if we need to insert the locale - for now default to 'en' or handle in frontend
  // Ideally, we'd pass locale to this function, but let's stick to 'en' as base for now
  // and maybe redirect based on browser later, or the user can change it.
  // Actually, let's construct a cleaner URL.
  const confirmUrl = `${baseUrl}/en/confirm-subscription?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #059669; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .url { word-break: break-all; color: #10b981; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Newsletter Confirmation</h1>
        </div>
        <div class="content">
            <h2>Almost there!</h2>
            <p>Thanks for subscribing to the ${appName} newsletter. We just need to confirm your email address.</p>
            
            <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Confirm Subscription</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="url">${confirmUrl}</p>
            
            <p>If you didn't subscribe, you can safely ignore this email.</p>
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
Almost there!

Thanks for subscribing to the ${appName} newsletter. We just need to confirm your email address.

Click this link to confirm:
${confirmUrl}

If you didn't subscribe, you can safely ignore this email.

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
    logger.info(`[Email] Newsletter confirmation sent to ${to}`);
  } catch (error) {
    logger.error('[Email] Failed to send newsletter confirmation:', error);
    throw new Error('Failed to send newsletter confirmation');
  }
}

/**
 * Send contact form submission notification to admin
 */
export async function sendContactNotificationEmail(message: {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    logger.info(
      '[Email] No ADMIN_EMAIL configured, skipping contact notification',
    );
    return;
  }

  const subject = `📩 [Contact] New Message from ${message.name}`;

  // Use environment variable for base URL if available
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://testingwithekki.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .section { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #3b82f6; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📩 New Contact Message</h1>
        </div>
        <div class="content">
            <p>You received a new message from the contact form.</p>
            
            <div class="section">
                <p><strong>From:</strong> ${message.name} (<a href="mailto:${message.email}">${message.email}</a>)</p>
                <p><strong>Date:</strong> ${message.createdAt.toLocaleString()}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                <p style="white-space: pre-wrap;">${message.message}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="${baseUrl}/admin/messages" class="button">View in Admin Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>TestingWithEkki Admin Notification</p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: adminEmail,
      replyTo: message.email,
      subject,
      html,
    });
    logger.info(`[Email] Contact notification sent to admin for message: ${message.id}`);
  } catch (error) {
    logger.error('[Email] Failed to send contact notification:', error);
    // Don't throw - notification failing shouldn't break the user flow if possible
  }
}
