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

// Export password reset method using direct API call
// BetterAuth endpoint is /api/auth/request-password-reset
export const forgetPassword = async ({ email, redirectTo }: { email: string; redirectTo?: string }) => {
    const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo }),
    });

    if (!response.ok) {
        console.error('[Auth] Password reset request failed:', response.status, await response.text());
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.json();
};

// resetPassword is available on the client
export const resetPassword = authClient.resetPassword;

// Re-export the client as default
export default authClient;
