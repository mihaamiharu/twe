import { describe, expect, test } from 'bun:test';
import { getContainedAuthUser } from '@/server/auth-user';

describe('getContainedAuthUser', () => {
  test.each([
    null,
    'context',
    {},
    { user: null },
    { user: { id: 123, email: 'user@example.com' } },
    { user: { id: 'user-1' } },
    { user: { id: 'user-1', email: false } },
  ])('rejects malformed auth context %#', (context) => {
    expect(getContainedAuthUser(context)).toBeNull();
  });

  test('returns the original valid user object with extra fields intact', () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Ada',
    };

    expect(getContainedAuthUser({ user })).toBe(user);
  });
});
