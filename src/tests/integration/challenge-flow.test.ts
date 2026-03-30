import { describe, test, expect, beforeAll, beforeEach, mock } from 'bun:test';
import { db, users, challenges, progress, submissions, testCases } from '../../db';
import { challengeSubmissionHandler } from '../../server/submissions.fn';
import { setupTestDb, truncateTables } from './setup';
import { eq } from 'drizzle-orm';

// Mock dependencies
const testUserId = '00000000-0000-0000-0000-000000000001';

void mock.module(
'@tanstack/react-start/server', () => ({
    getRequestHeaders: () => new Headers(),
}));

void mock.module(
'../../server/auth.server', () => ({
    auth: {
        api: {
            getSession: async () => ({
                user: { id: testUserId },
                session: { id: 'test-session' }
            })
        }
    }
}));

// Mock logger to avoid noise
void mock.module(
'@/lib/logger', () => ({
    logger: {
        info: () => { },
        error: () => { },
        warn: () => { },
    }
}));

// Mock content server for lazy sync (optional)
void mock.module(
'../../server/content.server', () => ({
    getRawChallengeContent: async (slug: string) => {
        if (slug === 'test-challenge') {
            return {
                slug: 'test-challenge',
                title: 'Test Challenge',
                type: 'JAVASCRIPT',
                difficulty: 'EASY',
                xpReward: 100,
                order: 1,
                description: 'Description',
                instructions: 'Instructions',
                starterCode: '',
                htmlContent: '',
                testCases: []
            };
        }
        return null;
    }
}));


describe('Challenge Flow Integration', () => {

    beforeAll(async () => {
        await setupTestDb();
    });

    beforeEach(async () => {
        mock.restore();
        await truncateTables();

        // Seed User
        await db.insert(users).values({
            id: testUserId,
            name: 'Test User',
            email: 'test@example.com',
            xp: 0,
            level: 1,
        });

        // Seed Challenge
        await db.insert(challenges).values({
            id: '00000000-0000-0000-0000-000000000101',
            title: 'Test Challenge',
            slug: 'test-challenge',
            type: 'JAVASCRIPT',
            xpReward: 100,
            difficulty: 'EASY',
            order: 1,
            description: 'test description',
            instructions: 'test instructions',
            htmlContent: '<div></div>',
            starterCode: '',
            isPublished: true,
            completionCount: 0
        });

        // Seed Test Case (Required for completion logic)
        await db.insert(testCases).values({
            id: '00000000-0000-0000-0000-000000000201',
            challengeId: '00000000-0000-0000-0000-000000000101',
            description: 'Should log hello',
            expectedOutput: 'hello',
            input: '',
            order: 1,
            isHidden: false
        });
    });

    test('should process successful submission', async () => {
        const input = {
            challengeSlug: 'test-challenge',
            code: 'console.log("hello")',
            testResults: [{ passed: true, output: 'hello' }],
            executionTime: 100,
            locale: 'en',
            isPractice: false
        };

        const result: any = await challengeSubmissionHandler({ 
            data: input,
            context: { user: { id: testUserId } }
        });

        expect(result.success).toBe(true);
        expect(result.data.isFirstCompletion).toBe(true);
        expect(result.data.submission.xpEarned).toBe(100);

        // Verify DB
        const user = await db.query.users.findFirst({
            where: eq(users.id, testUserId)
        });
        expect(user?.xp).toBe(100);

        const prog = await db.query.progress.findFirst({
            where: eq(progress.userId, testUserId)
        });
        expect(prog?.isCompleted).toBe(true); // Should be true if logic works
    });

    test('should process failed submission', async () => {
        const input = {
            challengeSlug: 'test-challenge',
            code: 'console.log("fail")',
            testResults: [{ passed: false, error: 'Failed' }],
            executionTime: 100,
            locale: 'en',
            isPractice: false
        };

        const result: any = await challengeSubmissionHandler({ 
            data: input,
            context: { user: { id: testUserId } }
        });

        expect(result.success).toBe(true); // Request success, but submission failed
        expect(result.data.submission.isPassed).toBe(false);

        // Verify DB
        const user = await db.query.users.findFirst({
            where: eq(users.id, testUserId)
        });
        expect(user?.xp).toBe(0); // No XP

        const prog = await db.query.progress.findFirst({
            where: eq(progress.userId, testUserId)
        });
        expect(prog?.isCompleted).toBe(false);
        expect(prog?.attempts).toBe(1);
    });
});
