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
        // @ts-expect-error - context is dynamic
        if ((context as any).auth?.user) {
            Sentry.setUser({
                // @ts-expect-error - context is dynamic
                id: (context as any).auth.user.id,
                // @ts-expect-error - context is dynamic
                email: (context as any).auth.user.email,
            });
        }

        const result = await next();
        return result;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
});
