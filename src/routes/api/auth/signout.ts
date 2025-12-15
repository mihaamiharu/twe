import { json } from '@tanstack/react-start';
import { authClient } from '@/lib/auth.client';

export async function POST() {
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
}
