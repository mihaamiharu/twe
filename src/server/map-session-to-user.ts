import { getContainedAuthUser, type AuthUser } from './auth-user';

function isOptionalString(value: unknown): value is string | null | undefined {
    return value === undefined || value === null || typeof value === 'string';
}

export function mapSessionToUser(session: unknown): AuthUser | null {
    const user = getContainedAuthUser(session);
    if (!user) {
        return null;
    }

    const name: unknown = 'name' in user ? user.name : undefined;
    const image: unknown = 'image' in user ? user.image : undefined;
    const role: unknown = 'role' in user ? user.role : undefined;
    if (
        !isOptionalString(name) ||
        !isOptionalString(image) ||
        !isOptionalString(role)
    ) return null;

    return {
        id: user.id,
        email: user.email,
        name: name || null,
        image: image || null,
        role: role || 'USER',
    };
}
