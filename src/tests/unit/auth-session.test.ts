import { describe, expect, test } from 'bun:test';
import { buildAuthSession, type SessionUser } from '@/server/auth-session';

const user: SessionUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Ada',
  image: null,
  emailVerified: true,
  role: 'USER',
};

describe('buildAuthSession', () => {
  test('omits an unavailable analytics measurement ID', () => {
    const session = buildAuthSession(user, undefined);

    expect(session.isAuthenticated).toBe(true);
    expect('gaMeasurementId' in session).toBe(false);
  });

  test('includes an available analytics measurement ID', () => {
    const session = buildAuthSession(null, 'G-TEST');

    expect(session).toEqual({
      user: null,
      isAuthenticated: false,
      gaMeasurementId: 'G-TEST',
    });
  });
});
