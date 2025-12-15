/**
 * Gamification System
 * 
 * XP calculation, leveling, and rewards system.
 * Based on: docs/TDD.md Section 5.3
 */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// XP reward ranges by difficulty
const XP_REWARDS: Record<Difficulty, { min: number; max: number }> = {
    EASY: { min: 10, max: 30 },
    MEDIUM: { min: 40, max: 70 },
    HARD: { min: 80, max: 150 },
};

/**
 * Calculate level from total XP
 * Formula: XP to reach level N = 100 * N * N
 * 
 * Level 1: 100 XP
 * Level 2: 400 XP (total)
 * Level 3: 900 XP (total)
 * Level 10: 10,000 XP (total)
 */
export function calculateLevel(totalXP: number): number {
    if (totalXP < 0) return 1;

    // Solve for level from 100 * level^2 = totalXP
    // level = sqrt(totalXP / 100)
    const level = Math.floor(Math.sqrt(totalXP / 100));
    return Math.max(1, level);
}

/**
 * Get total XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return 100 * level * level;
}

/**
 * Get XP required to reach the next level from current level
 */
export function getXPForNextLevel(currentLevel: number): number {
    return getXPForLevel(currentLevel + 1);
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getLevelProgress(totalXP: number): {
    currentLevel: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
    xpInCurrentLevel: number;
} {
    const currentLevel = calculateLevel(totalXP);
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForNext = nextLevelXP - currentLevelXP;
    const progress = Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);

    return {
        currentLevel,
        currentLevelXP,
        nextLevelXP,
        progress,
        xpInCurrentLevel,
    };
}

/**
 * Get XP reward for a challenge based on difficulty
 * Returns a fixed value based on the difficulty midpoint
 */
export function getXPReward(difficulty: Difficulty): number {
    const range = XP_REWARDS[difficulty];
    // Return midpoint for predictability
    return Math.floor((range.min + range.max) / 2);
}

/**
 * Get XP reward range for a difficulty
 */
export function getXPRewardRange(difficulty: Difficulty): { min: number; max: number } {
    return XP_REWARDS[difficulty];
}

/**
 * Check if adding XP would result in a level up
 */
export function checkLevelUp(
    currentXP: number,
    xpToAdd: number
): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
} {
    const oldLevel = calculateLevel(currentXP);
    const newLevel = calculateLevel(currentXP + xpToAdd);
    const leveledUp = newLevel > oldLevel;

    return {
        leveledUp,
        oldLevel,
        newLevel,
        levelsGained: newLevel - oldLevel,
    };
}

/**
 * Calculate bonus XP for streaks and achievements
 */
export function calculateBonusXP(
    baseXP: number,
    options: {
        streak?: number;
        firstCompletion?: boolean;
        perfectScore?: boolean;
    }
): {
    bonusXP: number;
    totalXP: number;
    bonuses: { name: string; amount: number }[];
} {
    const bonuses: { name: string; amount: number }[] = [];
    let bonusXP = 0;

    // First completion bonus (+50%)
    if (options.firstCompletion) {
        const bonus = Math.floor(baseXP * 0.5);
        bonuses.push({ name: 'First Completion', amount: bonus });
        bonusXP += bonus;
    }

    // Perfect score bonus (+25%)
    if (options.perfectScore) {
        const bonus = Math.floor(baseXP * 0.25);
        bonuses.push({ name: 'Perfect Score', amount: bonus });
        bonusXP += bonus;
    }

    // Streak bonus (+10% per day, max 50%)
    if (options.streak && options.streak > 1) {
        const streakMultiplier = Math.min(0.5, (options.streak - 1) * 0.1);
        const bonus = Math.floor(baseXP * streakMultiplier);
        bonuses.push({ name: `${options.streak}-Day Streak`, amount: bonus });
        bonusXP += bonus;
    }

    return {
        bonusXP,
        totalXP: baseXP + bonusXP,
        bonuses,
    };
}

/**
 * Format XP for display
 */
export function formatXP(xp: number): string {
    if (xp >= 1000000) {
        return `${(xp / 1000000).toFixed(1)}M`;
    }
    if (xp >= 1000) {
        return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
    const titles: Record<number, string> = {
        1: 'Novice',
        5: 'Apprentice',
        10: 'Practitioner',
        15: 'Specialist',
        20: 'Expert',
        25: 'Master',
        30: 'Grandmaster',
        40: 'Legend',
        50: 'Mythic',
    };

    let title = 'Novice';
    for (const [minLevel, levelTitle] of Object.entries(titles)) {
        if (level >= parseInt(minLevel)) {
            title = levelTitle;
        }
    }
    return title;
}
