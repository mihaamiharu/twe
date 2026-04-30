import { createMiddleware } from '@tanstack/react-start';
import { getSentryConfig } from '../lib/sentry.config';
import type * as Sentry from '@sentry/bun';

interface SentryContext {
    user?: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        role: string | null;
    } | null;
}

/**
 * Attach user context to Sentry if available
 */
export function attachSentryUserContext(
    context: SentryContext,
    Sentry: typeof Sentry,
) {
    if (context.user) {
        Sentry.setUser({
            id: context.user.id,
            email: context.user.email,
        });
    }
}

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
        attachSentryUserContext(context as unknown as SentryContext, Sentry);

        const result = await next();
        return result;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
});
