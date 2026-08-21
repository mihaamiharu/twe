import { createMiddleware } from '@tanstack/react-start';
import { getSentryConfig } from '../lib/sentry.config';
import type * as SentryModule from '@sentry/bun';
import { getContainedAuthUser } from './auth-user';

/**
 * Attach user context to Sentry if available
 */
export function attachSentryUserContext(
    context: unknown,
    Sentry: Pick<typeof SentryModule, 'setUser'>,
) {
    const user = getContainedAuthUser(context);
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
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
        attachSentryUserContext(context, Sentry);

        const result = await next();
        return result;
    } catch (error) {
        Sentry.captureException(error);
        throw error;
    }
});
