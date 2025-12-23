import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { db, users, challenges, progress } from '../../db';
import { getUserStats } from '../../lib/stats';
import { setupTestDb, truncateTables } from './setup';
import { eq } from 'drizzle-orm';

describe('Stats Integration', () => {
    const testUserId = '00000000-0000-0000-0000-000000000001';

    beforeAll(async () => {
        await setupTestDb();
    });

    beforeEach(async () => {
        await truncateTables();

        // Seed basic data
        await db.insert(users).values({
            id: testUserId,
            name: 'Test User',
            email: 'test@example.com',
            xp: 100,
            level: 1,
        });

        await db.insert(challenges).values([
            {
                id: '00000000-0000-0000-0000-000000000101',
                title: 'CSS Help',
                slug: 'css-help',
                type: 'CSS_SELECTOR',
                xpReward: 50,
                difficulty: 'EASY',
                order: 1,
                description: 'test description',
                instructions: 'test instructions',
                htmlContent: '<div></div>',
                starterCode: '',
            },
            {
                id: '00000000-0000-0000-0000-000000000102',
                title: 'XPath Master',
                slug: 'xpath-master',
                type: 'XPATH_SELECTOR',
                xpReward: 50,
                difficulty: 'EASY',
                order: 2,
                description: 'test description',
                instructions: 'test instructions',
                htmlContent: '<div></div>',
                starterCode: '',
            },
            {
                id: '00000000-0000-0000-0000-000000000103',
                title: 'JS Intro',
                slug: 'js-intro',
                type: 'JAVASCRIPT',
                xpReward: 50,
                difficulty: 'EASY',
                order: 3,
                description: 'test description',
                instructions: 'test instructions',
                htmlContent: '<div></div>',
                starterCode: '',
            },
        ]);
    });

    test('should calculate stats correctly for a user with completions', async () => {
        // Add progress
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        await db.insert(progress).values([
            {
                userId: testUserId,
                challengeId: '00000000-0000-0000-0000-000000000101',
                isCompleted: true,
                completedAt: yesterday,
                attempts: 1
            },
            {
                userId: testUserId,
                challengeId: '00000000-0000-0000-0000-000000000102',
                isCompleted: true,
                completedAt: now,
                attempts: 2
            }
        ]);

        const stats = await getUserStats(testUserId);

        expect(stats.totalChallengesCompleted).toBe(2);
        expect(stats.challengesByType['CSS_SELECTOR']).toBe(1);
        expect(stats.challengesByType['XPATH_SELECTOR']).toBe(1);
        expect(stats.currentStreak).toBe(2);
        expect(stats.perfectScores).toBe(1); // Only c1 had attempts = 1
    });

    test('should return zero stats for new user', async () => {
        const stats = await getUserStats(testUserId);
        expect(stats.totalChallengesCompleted).toBe(0);
        expect(stats.currentStreak).toBe(0);
    });

    test('should throw error if user not found', async () => {
        expect(getUserStats('00000000-0000-0000-0000-000000000404')).rejects.toThrow('User not found');
    });
});
