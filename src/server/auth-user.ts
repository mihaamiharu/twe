export interface AuthUserIdentity {
    id: string;
    email: string;
}

export interface AuthUser extends AuthUserIdentity {
    name: string | null;
    image: string | null;
    role: string | null;
}

function isAuthUserIdentity(
    value: unknown,
): value is object & AuthUserIdentity {
    return typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'email' in value &&
        typeof value.email === 'string';
}

export function getContainedAuthUser(
    value: unknown,
): (object & AuthUserIdentity) | null {
    if (typeof value !== 'object' || value === null || !('user' in value)) {
        return null;
    }

    const { user } = value;
    if (!isAuthUserIdentity(user)) {
        return null;
    }

    return user;
}
