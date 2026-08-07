import type { AuthUser } from './auth.mw';

interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string | null;
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
        role: session.user.role || 'USER',
    };
}
