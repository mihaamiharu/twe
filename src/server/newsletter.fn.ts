import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendNewsletterConfirmationEmail } from './email.server';
import { createRateLimitMiddleware } from './rate-limit.mw';
import { logger } from '@/lib/logger';
import { randomBytes } from 'crypto';

const SubscriberSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const generateToken = () => randomBytes(32).toString('hex');

export const subscribeToNewsletter = createServerFn({ method: 'POST' })
    .middleware([
        createRateLimitMiddleware({
            key: 'newsletter-subscribe',
            limit: 5,
            windowMinutes: 60,
        }),
    ])
    .inputValidator((data: unknown) => SubscriberSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { email } = input;
            const lowerEmail = email.toLowerCase();

            // Check if already subscribed
            const existing = await db.query.newsletterSubscribers.findFirst({
                where: eq(newsletterSubscribers.email, lowerEmail),
            });

            if (existing) {
                if (existing.status === 'CONFIRMED') {
                    return {
                        success: true,
                        message: 'You are already subscribed to our newsletter!',
                    };
                }

                // If pending or unsubscribed, resend confirmation
                const confirmationToken = generateToken();
                await db
                    .update(newsletterSubscribers)
                    .set({
                        status: 'PENDING',
                        confirmationToken,
                        updatedAt: new Date(),
                    })
                    .where(eq(newsletterSubscribers.id, existing.id));

                logger.info(`[Newsletter] Queuing resubscribe confirmation email for: ${lowerEmail}`);
                sendNewsletterConfirmationEmail(lowerEmail, confirmationToken).catch((err) => {
                    logger.error('[Newsletter] Failed to send resubscribe confirmation email:', err);
                });

                return {
                    success: true,
                    message: 'Confirmation email sent! Please check your inbox.',
                };
            }

            // Create new subscriber
            const confirmationToken = generateToken();
            await db.insert(newsletterSubscribers).values({
                email: lowerEmail,
                status: 'PENDING',
                confirmationToken,
            });

            logger.info(`[Newsletter] Queuing confirmation email for: ${lowerEmail}`);
            sendNewsletterConfirmationEmail(lowerEmail, confirmationToken).catch((err) => {
                logger.error('[Newsletter] Failed to send confirmation email:', err);
            });

            logger.info(`[Newsletter] New subscription request: ${lowerEmail}`);

            return {
                success: true,
                message: 'Confirmation email sent! Please check your inbox to confirm your subscription.',
            };
        } catch (error) {
            logger.error('Error subscribing to newsletter:', error);
            return {
                success: false,
                error: 'Failed to subscribe. Please try again later.',
            };
        }
    });

export const confirmSubscription = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
    .handler(async ({ data: { token } }) => {
        try {
            const subscriber = await db.query.newsletterSubscribers.findFirst({
                where: eq(newsletterSubscribers.confirmationToken, token),
            });

            if (!subscriber) {
                return {
                    success: false,
                    error: 'Invalid or expired confirmation token.',
                };
            }

            if (subscriber.status === 'CONFIRMED') {
                return {
                    success: true,
                    message: 'Subscription already confirmed!',
                };
            }

            await db
                .update(newsletterSubscribers)
                .set({
                    status: 'CONFIRMED',
                    confirmationToken: null, // Clear token after use
                    confirmedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(newsletterSubscribers.id, subscriber.id));

            logger.info(`[Newsletter] Subscriber confirmed: ${subscriber.email}`);

            return {
                success: true,
                message: 'Subscription confirmed successfully! Welcome aboard.',
            };
        } catch (error) {
            logger.error('Error confirming subscription:', error);
            return {
                success: false,
                error: 'Failed to confirm subscription.',
            };
        }
    });

export const unsubscribeFromNewsletter = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
    .handler(() => {
        // Note: In a real app, we'd include an unsubscribe token in every email.
        // For now, we'll implement the backend logic but since we're not sending broadcast emails yet,
        // we don't have a persistent unsubscribe token mechanism in the schema (we only have confirmationToken).
        // For this MVP, we'll assume the token passed is a valid identifier or we'd need to add 'unsubscribeToken' to the schema.
        // DECISION: For MVP, we'll skip public unsubscribe link generation until we have a broadcast system.
        // Admin can unsubscribe users manually.

        return {
            success: false,
            error: 'Unsubscribe feature coming soon with broadcast system.',
        };
    });
