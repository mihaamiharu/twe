import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '@/lib/email.server';

// Simple in-memory rate limiting (per email, 60 second cooldown)
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 60 seconds

export const Route = createFileRoute('/api/auth/resend-verification')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { email } = body;

                    if (!email || typeof email !== 'string') {
                        return json(
                            { success: false, error: 'Email is required' },
                            { status: 400 }
                        );
                    }

                    const normalizedEmail = email.toLowerCase().trim();

                    // Rate limiting check
                    const lastSent = rateLimitMap.get(normalizedEmail);
                    const now = Date.now();

                    if (lastSent && now - lastSent < COOLDOWN_MS) {
                        const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
                        return json(
                            {
                                success: false,
                                error: `Please wait ${remainingSeconds} seconds before requesting another email`,
                                cooldownRemaining: remainingSeconds,
                            },
                            { status: 429 }
                        );
                    }

                    // Find user by email
                    const user = await db.query.users.findFirst({
                        where: eq(users.email, normalizedEmail),
                    });

                    if (!user) {
                        // Don't reveal if email exists - return success anyway
                        return json({
                            success: true,
                            message: 'If an account with that email exists, a verification email has been sent.',
                        });
                    }

                    // Check if already verified
                    if (user.emailVerified) {
                        return json({
                            success: true,
                            message: 'Your email is already verified. You can sign in.',
                            alreadyVerified: true,
                        });
                    }

                    // Generate verification URL
                    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
                    const token = crypto.randomUUID();
                    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&callbackURL=/login`;

                    // Send the verification email
                    await sendVerificationEmail(user.email, verificationUrl, user.name || undefined);

                    // Update rate limit
                    rateLimitMap.set(normalizedEmail, now);

                    return json({
                        success: true,
                        message: 'Verification email sent! Please check your inbox.',
                    });
                } catch (error) {
                    logger.error('Error resending verification email:', error);
                    return json(
                        { success: false, error: 'Failed to resend verification email' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});
