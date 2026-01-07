import { describe, it, expect } from 'bun:test';
import {
    calculateLevel,
    getXPForLevel,
    getXPForNextLevel,
    getLevelProgress,
    getXPReward,
    getXPRewardRange,
    checkLevelUp,
    calculateBonusXP,
    formatXP,
    getLevelTitle,

} from '../../lib/gamification';

describe('gamification', () => {
    describe('calculateLevel', () => {
        it('should return level 1 for XP < 100', () => {
            expect(calculateLevel(0)).toBe(1);
            expect(calculateLevel(50)).toBe(1);
            expect(calculateLevel(99)).toBe(1);
        });

        it('should calculate level correctly for various XP thresholds', () => {
            // Formula: XP = 100 * level^2
            expect(calculateLevel(100)).toBe(1); // sqrt(100/100) = 1
            expect(calculateLevel(399)).toBe(1);
            expect(calculateLevel(400)).toBe(2); // sqrt(400/100) = 2
            expect(calculateLevel(899)).toBe(2);
            expect(calculateLevel(900)).toBe(3); // sqrt(900/100) = 3
            expect(calculateLevel(10000)).toBe(10); // sqrt(10000/100) = 10
        });

        it('should return level 1 for negative XP', () => {
            expect(calculateLevel(-100)).toBe(1);
        });
    });

    describe('getXPForLevel', () => {
        it('should return 0 for level <= 1', () => {
            expect(getXPForLevel(0)).toBe(0);
            expect(getXPForLevel(1)).toBe(0);
        });

        it('should return correct XP for levels > 1', () => {
            expect(getXPForLevel(2)).toBe(400);
            expect(getXPForLevel(3)).toBe(900);
            expect(getXPForLevel(10)).toBe(10000);
        });
    });

    describe('getXPForNextLevel', () => {
        it('should return XP required for level + 1', () => {
            expect(getXPForNextLevel(1)).toBe(400);
            expect(getXPForNextLevel(2)).toBe(900);
        });
    });

    describe('getLevelProgress', () => {
        it('should calculate progress correctly within a level', () => {
            // Level 1: 0-400 XP
            // At 100 XP, progress should be 25%? No, the formula uses (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)
            // For level 1, currentLevelXP = 0, nextLevelXP = 400.
            // At 100 XP: (100 - 0) / (400 - 0) = 0.25 (25%)
            const progress1 = getLevelProgress(100);
            expect(progress1.currentLevel).toBe(1);
            expect(progress1.progress).toBe(25);
            expect(progress1.xpInCurrentLevel).toBe(100);

            // Level 2: 400-900 XP
            // At 650 XP: (650 - 400) / (900 - 400) = 250 / 500 = 0.5 (50%)
            const progress2 = getLevelProgress(650);
            expect(progress2.currentLevel).toBe(2);
            expect(progress2.progress).toBe(50);
            expect(progress2.xpInCurrentLevel).toBe(250);
        });

        it('should cap progress at 100%', () => {
            // This case shouldn't normally happen with calculateLevel, but good to test the Math.min
            const progress = getLevelProgress(400); // Level 2
            expect(progress.currentLevel).toBe(2);
            expect(progress.progress).toBe(0);
        });
    });

    describe('getXPReward and getXPRewardRange', () => {
        it('should return correct midpoint rewards', () => {
            expect(getXPReward('EASY')).toBe(20); // (10+30)/2
            expect(getXPReward('MEDIUM')).toBe(55); // (40+70)/2
            expect(getXPReward('HARD')).toBe(115); // (80+150)/2
        });

        it('should return correct ranges', () => {
            expect(getXPRewardRange('EASY')).toEqual({ min: 10, max: 30 });
            expect(getXPRewardRange('MEDIUM')).toEqual({ min: 40, max: 70 });
            expect(getXPRewardRange('HARD')).toEqual({ min: 80, max: 150 });
        });
    });

    describe('checkLevelUp', () => {
        it('should detect when a level up occurs', () => {
            // Level 1 is < 400 XP
            const result = checkLevelUp(350, 100); // 450 total -> Level 2
            expect(result.leveledUp).toBe(true);
            expect(result.oldLevel).toBe(1);
            expect(result.newLevel).toBe(2);
            expect(result.levelsGained).toBe(1);
        });

        it('should detect multiple level ups', () => {
            const result = checkLevelUp(350, 600); // 950 total -> Level 3
            expect(result.leveledUp).toBe(true);
            expect(result.oldLevel).toBe(1);
            expect(result.newLevel).toBe(3);
            expect(result.levelsGained).toBe(2);
        });

        it('should return false when no level up occurs', () => {
            const result = checkLevelUp(100, 50); // 150 total -> still Level 1
            expect(result.leveledUp).toBe(false);
            expect(result.levelsGained).toBe(0);
        });
    });

    describe('calculateBonusXP', () => {
        const baseXP = 100;

        it('should add first completion bonus (+50%)', () => {
            const result = calculateBonusXP(baseXP, { firstCompletion: true });
            expect(result.bonusXP).toBe(50);
            expect(result.totalXP).toBe(150);
            expect(result.bonuses).toContainEqual({ name: 'First Completion', amount: 50 });
        });

        it('should add perfect score bonus (+25%)', () => {
            const result = calculateBonusXP(baseXP, { perfectScore: true });
            expect(result.bonusXP).toBe(25);
            expect(result.totalXP).toBe(125);
            expect(result.bonuses).toContainEqual({ name: 'Perfect Score', amount: 25 });
        });

        it('should add streak bonus (+10% per day, max 50%)', () => {
            // 2-day streak: (2-1)*0.1 = 0.1
            const result2 = calculateBonusXP(baseXP, { streak: 2 });
            expect(result2.bonusXP).toBe(10);
            expect(result2.bonuses).toContainEqual({ name: '2-Day Streak', amount: 10 });

            // 5-day streak: (5-1)*0.1 = 0.4
            const result5 = calculateBonusXP(baseXP, { streak: 5 });
            expect(result5.bonusXP).toBe(40);
            expect(result5.bonuses).toContainEqual({ name: '5-Day Streak', amount: 40 });

            // 10-day streak: capped at 50%
            const result10 = calculateBonusXP(baseXP, { streak: 10 });
            expect(result10.bonusXP).toBe(50);
            expect(result10.bonuses).toContainEqual({ name: '10-Day Streak', amount: 50 });
        });

        it('should combine multiple bonuses', () => {
            const result = calculateBonusXP(baseXP, {
                firstCompletion: true,
                perfectScore: true,
                streak: 3
            });
            // 50 (first) + 25 (perfect) + 20 (streak) = 95
            expect(result.bonusXP).toBe(95);
            expect(result.totalXP).toBe(195);
        });
    });

    describe('formatXP', () => {
        it('should format simple numbers', () => {
            expect(formatXP(0)).toBe('0');
            expect(formatXP(500)).toBe('500');
            expect(formatXP(999)).toBe('999');
        });

        it('should format thousands (K)', () => {
            expect(formatXP(1000)).toBe('1.0K');
            expect(formatXP(1500)).toBe('1.5K');
            expect(formatXP(99900)).toBe('99.9K');
        });

        it('should format millions (M)', () => {
            expect(formatXP(1000000)).toBe('1.0M');
            expect(formatXP(2500000)).toBe('2.5M');
        });

        it('should handle null/undefined', () => {
            expect(formatXP(null)).toBe('0');
            expect(formatXP(undefined)).toBe('0');
        });
    });

    describe('getLevelTitle', () => {
        it('should return Novice for low levels', () => {
            expect(getLevelTitle(1)).toBe('novice');
            expect(getLevelTitle(4)).toBe('novice');
        });

        it('should return higher titles as level increases', () => {
            expect(getLevelTitle(5)).toBe('apprentice');
            expect(getLevelTitle(10)).toBe('practitioner');
            expect(getLevelTitle(25)).toBe('master');
            expect(getLevelTitle(100)).toBe('mythic');
        });

        it('should handle null/undefined by defaulting to Novice', () => {
            expect(getLevelTitle(null)).toBe('novice');
            expect(getLevelTitle(undefined)).toBe('novice');
        });
    });
});
