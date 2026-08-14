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

function isOptionalString(value: unknown): value is string | null | undefined {
    return value === undefined || value === null || typeof value === 'string';
}

function isSession(value: unknown): value is Session {
    if (typeof value !== 'object' || value === null || !('user' in value)) {
        return false;
    }

    const { user } = value;
    return (
        typeof user === 'object' &&
        user !== null &&
        'id' in user &&
        typeof user.id === 'string' &&
        'email' in user &&
        typeof user.email === 'string' &&
        (!('name' in user) || isOptionalString(user.name)) &&
        (!('image' in user) || isOptionalString(user.image)) &&
        (!('role' in user) || isOptionalString(user.role))
    );
}

export function mapSessionToUser(session: unknown): AuthUser | null {
    if (!isSession(session)) {
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
