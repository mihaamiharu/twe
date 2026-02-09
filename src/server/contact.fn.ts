import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { sendContactNotificationEmail } from './email.server';
import { createRateLimitMiddleware } from './rate-limit.mw';
import { logger } from '@/lib/logger';

const ContactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const submitContactMessage = createServerFn({ method: 'POST' })
    .middleware([
        createRateLimitMiddleware({
            key: 'contact-submit',
            limit: 3,
            windowMinutes: 60,
        }),
    ])
    .inputValidator((data: unknown) => ContactSchema.parse(data))
    .handler(async ({ data: input }) => {
        try {
            const { name, email, message } = input;

            // 1. Store in DB
            const [newMessage] = await db
                .insert(contactMessages)
                .values({
                    name,
                    email,
                    message,
                    status: 'NEW',
                })
                .returning();

            logger.info(`[Contact] New message from ${email} (ID: ${newMessage.id})`);

            // 2. Send email notification to admin
            // Fire and forget - don't block response on email sending
            sendContactNotificationEmail({
                id: newMessage.id,
                name,
                email,
                message,
                createdAt: newMessage.createdAt,
            }).catch((err) => {
                logger.error('[Contact] Failed to send notification email:', err);
            });

            return {
                success: true,
                message: 'Message sent successfully! We will get back to you soon.',
            };
        } catch (error) {
            logger.error('Error submitting contact message:', error);
            return {
                success: false,
                error: 'Failed to send message. Please try again later.',
            };
        }
    });
