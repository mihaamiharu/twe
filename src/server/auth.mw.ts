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

// Type for authenticated user context
export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string | null;
}

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
export const authMiddleware = createMiddleware().server(async ({ next }) => {
    const { getRequestHeaders } = await import('@tanstack/react-start/server');
    const { auth } = await import('./auth.server');

    const headers = getRequestHeaders() as Headers;
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    return next({
        context: {
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name || null,
                image: session.user.image || null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                role: (session.user as any).role || 'USER',
            },
            userId: session.user.id,
        },
    });
});

/**
 * Admin middleware - ensures user has ADMIN role.
 * Extends authMiddleware.
 */
export const adminMiddleware = createMiddleware()
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
        if (context.user.role !== 'ADMIN') {
            throw new Error('Unauthorized: Admin access required');
        }

        return next({
            context: {
                user: context.user,
                userId: context.userId,
            }
        });
    });

// TODO: Add optionalAuthMiddleware once TanStack Start supports
// middleware with union return types for optional auth scenarios.
// For now, use getServerSession() directly for optional auth.

