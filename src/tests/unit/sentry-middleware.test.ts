import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { attachSentryUserContext } from '../../server/sentry.mw';

describe('attachSentryUserContext', () => {
    const mockSetUser = mock(() => {});

    const mockSentry = {
        setUser: mockSetUser,
    } as any;

    beforeEach(() => {
        mockSetUser.mockReset();
    });

    it('should set user context when user is present in context', () => {
        const context = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                image: null,
                role: 'USER',
            },
        };

        attachSentryUserContext(context, mockSentry);

        expect(mockSetUser).toHaveBeenCalledWith({
            id: 'user-123',
            email: 'test@example.com',
        });
    });

    it('should not set user context when user is null (optionalAuthMiddleware without session)', () => {
        const context = {
            user: null,
            userId: null,
            isAuthenticated: false,
        };

        attachSentryUserContext(context, mockSentry);

        expect(mockSetUser).not.toHaveBeenCalled();
    });

    it('should not set user context when user is undefined (no auth middleware)', () => {
        const context = {};

        attachSentryUserContext(context as any, mockSentry);

        expect(mockSetUser).not.toHaveBeenCalled();
    });
});
