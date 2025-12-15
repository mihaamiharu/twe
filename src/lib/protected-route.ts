import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Protected Route wrapper
 * Redirects unauthenticated users to login
 * Usage: Add this to any route that requires authentication
 */
export function createProtectedRoute() {
    return {
        beforeLoad: async ({ context }: { context: { isAuthenticated?: boolean } }) => {
            // In a real app, check session from context or auth client
            // For now, this is a placeholder that can be implemented when auth is fully connected
            if (!context?.isAuthenticated) {
                throw redirect({
                    to: '/login',
                    search: {
                        redirect: location.pathname,
                    },
                });
            }
        },
    };
}

// Auth context interface for type safety
export interface AuthContext {
    isAuthenticated: boolean;
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
}
