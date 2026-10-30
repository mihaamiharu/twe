import { beforeEach, describe, expect, test } from 'bun:test';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { getRuntimeEnv } from '#platform';
import { db, accounts, sessions, users } from '../../db';
import { auth } from '../../server/auth.server';
import { truncateTables } from './setup';

const email = 'existing-format@example.invalid';
const password = 'Existing-format-synthetic-only-2026';
const userId = '00000000-0000-4000-8000-000000000012';

function request(path: string, body?: object, cookie?: string) {
  const origin = getRuntimeEnv().BETTER_AUTH_URL;
  return new Request(`${origin}/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: origin,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('Better Auth with real local D1 persistence', () => {
  beforeEach(truncateTables);

  test('existing-format credentials keep their identity, role, hash and cookie session', async () => {
    const hash = await hashPassword(password);
    await db.insert(users).values({
      id: userId,
      email,
      name: 'Synthetic existing account',
      emailVerified: true,
      role: 'ADMIN',
    });
    await db.insert(accounts).values({
      userId,
      accountId: userId,
      providerId: 'credential',
      password: hash,
    });
    const login = await auth.handler(
      request('sign-in/email', { email, password }),
    );
    expect(login.status).toBe(200);
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    expect(cookie).toContain('session_token=');
    const session = await auth.handler(
      request('get-session', undefined, cookie),
    );
    const value: unknown = await session.json();
    expect(value).toMatchObject({ user: { id: userId, role: 'ADMIN', email } });
    expect(
      (
        await db.query.accounts.findFirst({
          where: eq(accounts.userId, userId),
        })
      )?.password,
    ).toBe(hash);
    const persisted = await db.query.sessions.findFirst({
      where: eq(sessions.userId, userId),
    });
    expect(persisted?.expiresAt).toBeInstanceOf(Date);
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 5000) })
      .where(eq(sessions.userId, userId));
    const expired = await auth.handler(
      request('get-session', undefined, cookie),
    );
    expect(await expired.json()).toBeNull();
  });

  test('registration cannot supply an administrative role and logout revokes its session', async () => {
    const signup = await auth.handler(
      request('sign-up/email', {
        email,
        password,
        name: 'Synthetic registration',
        role: 'ADMIN',
      }),
    );
    expect(signup.status).toBe(200);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(user?.role).toBe('USER');
    const cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const logout = await auth.handler(request('sign-out', {}, cookie));
    expect(logout.status).toBe(200);
    const session = await auth.handler(
      request('get-session', undefined, cookie),
    );
    expect(await session.json()).toBeNull();
  });
});
