import { createMiddleware } from '@tanstack/react-start';
import * as Sentry from '@sentry/bun';

/**
 * Middleware to attach user context to Sentry and capture errors
 */
export const sentryMiddleware = createMiddleware().server(async ({ next, context }) => {
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
