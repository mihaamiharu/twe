import { describe, test, expect } from 'bun:test';
import { checkAchievements, type UserStats, ACHIEVEMENTS } from '../../lib/achievements';

describe('Achievements Logic', () => {
    const defaultStats: UserStats = {
        totalChallengesCompleted: 0,
        challengesByType: {},
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        tutorialsCompleted: 0,
        perfectScores: 0
    };

    test('should return empty list if no new achievements earned', () => {
        const earned = checkAchievements(defaultStats, new Set());
        expect(earned.length).toBe(0);
    });

    test('should unlock first challenge achievement', () => {
        const stats: UserStats = { ...defaultStats, totalChallengesCompleted: 1 };
        const earned = checkAchievements(stats, new Set());

        const firstChallenge = earned.find(a => a.id === 'first-challenge');
        expect(firstChallenge).toBeDefined();
    });

    test('should not return already earned achievements', () => {
        const stats: UserStats = { ...defaultStats, totalChallengesCompleted: 1 };
        const alreadyEarned = new Set(['first-challenge']);
        const earned = checkAchievements(stats, alreadyEarned);

        expect(earned.find(a => a.id === 'first-challenge')).toBeUndefined();
    });

    test('should unlock streak achievements', () => {
        const stats: UserStats = { ...defaultStats, currentStreak: 3, longestStreak: 3 };
        const earned = checkAchievements(stats, new Set());

        expect(earned.find(a => a.id === 'streak-3')).toBeDefined();
    });

    test('should unlock XP achievements', () => {
        const stats: UserStats = { ...defaultStats, totalXP: 100 };
        const earned = checkAchievements(stats, new Set());

        expect(earned.find(a => a.id === 'xp-100')).toBeDefined();
    });

    test('should unlock category specific achievements', () => {
        const stats: UserStats = {
            ...defaultStats,
            challengesByType: { 'JAVASCRIPT': 23 },
            totalChallengesCompleted: 23
        };
        const earned = checkAchievements(stats, new Set());

        // This assumes 'tier-beginner-master' requires 23 JS challenges
        expect(earned.find(a => a.id === 'tier-beginner-master')).toBeDefined();
    });
});
