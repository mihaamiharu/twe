import { json } from '@tanstack/react-start';
import { authClient } from '@/lib/auth.client';

export async function GET() {
    try {
        const session = await authClient.getSession();

        if (!session.data) {
            return json({ authenticated: false, user: null });
        }

        return json({
            authenticated: true,
            user: session.data.user,
            session: {
                expiresAt: session.data.session?.expiresAt,
            },
        });
    } catch (error) {
        console.error('Session error:', error);
        return json({ authenticated: false, user: null, error: 'Failed to get session' });
    }
}
