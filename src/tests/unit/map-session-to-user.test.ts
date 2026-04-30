import { describe, it, expect } from 'bun:test';
import { mapSessionToUser } from '../../server/map-session-to-user';

describe('mapSessionToUser', () => {
    it('returns null when session is null', () => {
        expect(mapSessionToUser(null)).toBeNull();
    });

    it('returns null when session.user is missing', () => {
        expect(mapSessionToUser({} as any)).toBeNull();
    });

    it('maps valid session to AuthUser with default USER role', () => {
        const session = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                image: 'https://example.com/avatar.png',
            },
        };

        const result = mapSessionToUser(session);

        expect(result).toEqual({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://example.com/avatar.png',
            role: 'USER',
        });
    });

    it('preserves explicit role from session', () => {
        const session = {
            user: {
                id: 'admin-123',
                email: 'admin@example.com',
                name: 'Admin User',
                image: null,
                role: 'ADMIN',
            },
        };

        const result = mapSessionToUser(session);

        expect(result).toEqual({
            id: 'admin-123',
            email: 'admin@example.com',
            name: 'Admin User',
            image: null,
            role: 'ADMIN',
        });
    });

    it('defaults name and image to null when undefined', () => {
        const session = {
            user: {
                id: 'user-456',
                email: 'noname@example.com',
            },
        };

        const result = mapSessionToUser(session);

        expect(result?.name).toBeNull();
        expect(result?.image).toBeNull();
    });

    it('handles empty string role by defaulting to USER', () => {
        const session = {
            user: {
                id: 'user-789',
                email: 'emptyrole@example.com',
                role: '',
            },
        };

        const result = mapSessionToUser(session);

        expect(result?.role).toBe('USER');
    });
});
