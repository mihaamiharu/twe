import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { authClient } from '@/lib/auth.client';

export const Route = createFileRoute('/api/auth/signout')({
    server: {
        handlers: {
            POST: async () => {
                try {
                    await authClient.signOut();
                    return json({ success: true });
                } catch (error) {
                    console.error('Sign out error:', error);
                    return json(
                        { success: false, error: 'Failed to sign out' },
                        { status: 500 },
                    );
                }
            },
        },
    },
});
