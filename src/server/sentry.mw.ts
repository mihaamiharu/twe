import { createMiddleware } from '@tanstack/react-start';
import { getSentryConfig } from '../lib/sentry.config';
import type * as SentryModule from '@sentry/bun';

interface SentryContext {
    user?: {
        id: string;
        email: string;
    } | null;
}

/**
 * Attach user context to Sentry if available
 */
export function attachSentryUserContext(
    context: unknown,
    Sentry: Pick<typeof SentryModule, 'setUser'>,
) {
    if (isSentryContext(context) && context.user) {
        Sentry.setUser({
            id: context.user.id,
            email: context.user.email,
        });
    }
}

function isSentryContext(value: unknown): value is SentryContext {
    if (typeof value !== 'object' || value === null || !('user' in value)) {
        return false;
    }
    const { user } = value;
    return user === undefined || user === null || (
        typeof user === 'object' &&
        'id' in user &&
        typeof user.id === 'string' &&
        'email' in user &&
        typeof user.email === 'string'
    );
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
