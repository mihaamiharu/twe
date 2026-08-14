/**
 * Composable Auth Middleware for TanStack Start
 * Follows 2026 TanStack Start middleware pattern
 *
 * Usage:
 * export const protectedFn = createServerFn({ method: 'POST' })
 *   .middleware([authMiddleware])
 *   .handler(async ({ context }) => {
 *     const userId = context.userId; // Type-safe, guaranteed to exist
 *   });
 */
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { auth } from './auth.server';
import { mapSessionToUser } from './map-session-to-user';
import type { AuthUser } from './auth-user';

export type { AuthUser } from './auth-user';

// Context provided by authMiddleware (user guaranteed to exist)
export interface AuthContext {
    user: AuthUser;
    userId: string;
}

/**
 * Strict auth middleware - throws if not authenticated.
 * Use for protected endpoints that require login.
 *
 * The error is thrown and should be caught by your error boundary
 * or handled by TanStack Start's built-in error handling.
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(
    async ({ next }) => {
        const session = await auth.api.getSession({
            headers: getRequest().headers,
        });

        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        const user = mapSessionToUser(session);
        if (!user) {
            throw new Error('Unauthorized');
        }

        return next({
            context: {
                user,
                userId: session.user.id,
            },
        });
    },
);

/**
 * Optional auth middleware - does NOT throw if not authenticated.
 * Use for public endpoints that can be enhanced with user data.
 */
export const optionalAuthMiddleware = createMiddleware({
    type: 'function',
}).server(async ({ next }) => {
    const session = await auth.api.getSession({
        headers: getRequest().headers,
    });

    const user = mapSessionToUser(session);

    return next({
        context: {
            user,
            userId: session?.user?.id || null,
            isAuthenticated: !!session?.user,
        },
    });
});

/**
 * Admin middleware - ensures user has ADMIN role.
 * Extends authMiddleware.
 */
export const adminMiddleware = createMiddleware({ type: 'function' })
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
        if (context.user.role !== 'ADMIN') {
            throw new Error('Unauthorized: Admin access required');
        }

        return next({
            context: {
                user: context.user,
                userId: context.userId,
            },
        });
    });
