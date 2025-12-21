/**
 * Server function to get BetterAuth session
 * Used by route beforeLoad to check authentication
 */
import { createServerFn } from '@tanstack/react-start';

export type SessionUser = {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
};

export type AuthSession = {
    user: SessionUser | null;
    isAuthenticated: boolean;
};

export const getServerSession = createServerFn({ method: 'GET' }).handler(
    async (): Promise<AuthSession> => {
        try {
            // Dynamically import server-only modules to prevent client bundle leakage
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');

            const headers = getRequestHeaders();
            const session = await auth.api.getSession({ headers });

            if (session?.user) {
                return {
                    user: {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.name || null,
                        image: session.user.image || null,
                        emailVerified: session.user.emailVerified || false,
                    },
                    isAuthenticated: true,
                };
            }
        } catch (error) {
            console.error('[Auth] Failed to get session:', error);
        }

        return { user: null, isAuthenticated: false };
    }
);
