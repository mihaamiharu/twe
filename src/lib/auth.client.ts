import { createAuthClient } from 'better-auth/react';

// Create the auth client for React
export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});

// Export commonly used hooks for convenience
export const {
    useSession,
    signIn,
    signUp,
    signOut,
} = authClient;

// Re-export the client as default
export default authClient;
