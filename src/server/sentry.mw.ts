import { createMiddleware } from '@tanstack/react-start';
import { getSentryConfig } from '../lib/sentry.config';

/**
 * Middleware to attach user context to Sentry and capture errors
 */
export const sentryMiddleware = createMiddleware().server(async ({ next, context }) => {
    // Dynamic import to avoid bundling server dependencies (node:util) in client build
    const Sentry = await import('@sentry/bun');

    // Ensure initialized
    if (!Sentry.isInitialized()) {
        Sentry.init(getSentryConfig());
    }

    try {
        // If we have a user in context (from auth middleware), add it to Sentry scope
        /* @ts-ignore - context type is dynamic */
        if (context.auth?.user) {
            Sentry.setUser({
                /* @ts-ignore - context type is dynamic */
                id: context.auth.user.id,
                /* @ts-ignore - context type is dynamic */
                email: context.auth.user.email,
            });
        }

        const result = await next();
        return result;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
});
