import type { AuthUser } from './auth.mw';

interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
}

interface Session {
    user: SessionUser;
}

export function mapSessionToUser(session: Session | null): AuthUser | null {
    if (!session?.user) {
        return null;
    }

    return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        role: (session.user as any).role || 'USER',
    };
}
