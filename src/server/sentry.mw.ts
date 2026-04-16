import { createMiddleware } from '@tanstack/react-start';
import { getSentryConfig } from '../lib/sentry.config';
import { type AuthUser } from './auth.mw';

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
        const user = (context as { user?: AuthUser | null }).user;
        if (user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
            });
        }

        const result = await next();
        return result;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
});
