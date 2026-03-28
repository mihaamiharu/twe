import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test';
import { db } from '../../db';
import { users, challenges, tutorials, progress, submissions } from '../../db/schema';
import { truncateTables } from './setup';
import { eq } from 'drizzle-orm';

import { Route as teardownRoute } from '../../routes/api/test/teardown-user';
import { Route as resetRoute } from '../../routes/api/test/reset-progress';
import { Route as setProgressRoute } from '../../routes/api/test/set-progress';

const TEST_SECRET = 'test-secret-123';
const TEST_EMAIL = 'e2e-tester@example.com';

describe('E2E Test Support APIs', () => {
  let originalEnv: string;
  let originalSecret: string | undefined;

  beforeAll(async () => {
    originalEnv = process.env.NODE_ENV || 'development';
    originalSecret = process.env.E2E_SECRET;

    process.env.NODE_ENV = 'test';
    process.env.E2E_SECRET = TEST_SECRET;

    await truncateTables();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret !== undefined) {
      process.env.E2E_SECRET = originalSecret;
    } else {
      delete process.env.E2E_SECRET;
    }
  });

  beforeEach(async () => {
    await truncateTables();
    
    // Seed some static data for tests
    const [insertedUser] = await db.insert(users).values({
      email: TEST_EMAIL,
      name: 'Test Tester',
    }).returning();

    await db.insert(challenges).values({
      slug: 'e2e-test-challenge',
      title: { en: 'Test', id: 'Test' },
      type: 'JAVASCRIPT',
      difficulty: 'EASY',
      xpReward: 10,
      order: 1,
    });

    await db.insert(tutorials).values({
      slug: 'e2e-test-tutorial',
      title: { en: 'Test Tut', id: 'Test Tut' },
      order: 1,
      estimatedMinutes: 5,
    });
  });

  // Helper builder
  function buildRequest(body: any, secret: string = TEST_SECRET) {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-e2e-secret': secret } : {}),
      },
    });
    return req;
  }

  describe('Security Gates', () => {
    test('rejects request without correct secret header', async () => {
      // @ts-ignore - reaching into internal options
      const handler = teardownRoute.options.server.handlers.POST;
      const req = buildRequest({ email: TEST_EMAIL }, 'wrong-secret');
      
      const res = await handler({ request: req });
      expect(res.status).toBe(403);
    });

    test('rejects request if NODE_ENV is not test', async () => {
      // @ts-ignore 
      const handler = teardownRoute.options.server.handlers.POST;
      const req = buildRequest({ email: TEST_EMAIL });
      
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const res = await handler({ request: req });
      process.env.NODE_ENV = origEnv;
      
      expect(res.status).toBe(403);
    });
  });

  describe('Teardown User API', () => {
    test('successfully deletes an existing user', async () => {
      // @ts-ignore 
      const handler = teardownRoute.options.server.handlers.POST;
      const req = buildRequest({ email: TEST_EMAIL });
      
      const res = await handler({ request: req });
      expect(res.status).toBe(200);

      const user = await db.query.users.findFirst({ where: eq(users.email, TEST_EMAIL) });
      expect(user).toBeUndefined();
    });
  });

  describe('Set & Reset Progress APIs', () => {
    test('sets challenge progress correctly and grants XP', async () => {
      // @ts-expect-error - reaching into internal handlers
      const handler = setProgressRoute.options.server.handlers.POST;
      const req = buildRequest({ email: TEST_EMAIL, type: 'challenge', slug: 'e2e-test-challenge', xp: 50 });
      
      const res = await handler({ request: req });
      expect(res.status).toBe(200);

      // Verify db
      const user = await db.query.users.findFirst({ where: eq(users.email, TEST_EMAIL) });
      expect(user?.xp).toBe(50); // was 0

      const prog = await db.query.progress.findMany();
      expect(prog.length).toBe(1);
      expect(prog[0].isCompleted).toBe(true);
      
      const subs = await db.query.submissions.findMany();
      expect(subs.length).toBe(1);
      expect(subs[0].isPassed).toBe(true);
      expect(subs[0].xpEarned).toBe(50);
    });

    test('resets all challenge progress and resets user XP', async () => {
      // Setup: set progress first
      // @ts-expect-error - reaching into internal handlers
      const setHandler = setProgressRoute.options.server.handlers.POST;
      await setHandler({ request: buildRequest({ email: TEST_EMAIL, type: 'challenge', slug: 'e2e-test-challenge', xp: 50 }) });
      
      // Reset
      // @ts-expect-error - reaching into internal handlers
      const resetHandler = resetRoute.options.server.handlers.POST;
      const req = buildRequest({ email: TEST_EMAIL, type: 'challenge' }); // null slug means all 
      const res = await resetHandler({ request: req });
      expect(res.status).toBe(200);

      // Verify wiped
      const user = await db.query.users.findFirst({ where: eq(users.email, TEST_EMAIL) });
      expect(user?.xp).toBe(0);

      const prog = await db.query.progress.findMany();
      expect(prog.length).toBe(0);

      const subs = await db.query.submissions.findMany();
      expect(subs.length).toBe(0);
    });
  });
});
