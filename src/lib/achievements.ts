/**
 * Achievement System
 * 
 * Achievement definitions, checking, and awarding logic.
 */

export type AchievementCategory =
    | 'CHALLENGES'
    | 'TUTORIALS'
    | 'STREAK'
    | 'XP'
    | 'SPECIAL';

export interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    xpReward: number;
    criteria: AchievementCriteria;
    secret?: boolean;
}

export interface AchievementCriteria {
    type: 'count' | 'streak' | 'xp' | 'level' | 'special';
    target: number;
    challengeType?: string;
}

export interface UserStats {
    totalChallengesCompleted: number;
    challengesByType: Record<string, number>;
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    tutorialsCompleted: number;
    perfectScores: number;
}

export interface AwardedAchievement {
    achievement: Achievement;
    earnedAt: Date;
}

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
    // Challenges
    {
        id: 'first-steps',
        key: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        icon: '🎯',
        category: 'CHALLENGES',
        xpReward: 25,
        criteria: { type: 'count', target: 1 },
    },
    {
        id: 'getting-started',
        key: 'getting-started',
        name: 'Getting Started',
        description: 'Complete 5 challenges',
        icon: '🚀',
        category: 'CHALLENGES',
        xpReward: 50,
        criteria: { type: 'count', target: 5 },
    },
    {
        id: 'challenger',
        key: 'challenger',
        name: 'Challenger',
        description: 'Complete 10 challenges',
        icon: '⚡',
        category: 'CHALLENGES',
        xpReward: 100,
        criteria: { type: 'count', target: 10 },
    },
    {
        id: 'dedicated',
        key: 'dedicated',
        name: 'Dedicated',
        description: 'Complete 25 challenges',
        icon: '💪',
        category: 'CHALLENGES',
        xpReward: 200,
        criteria: { type: 'count', target: 25 },
    },
    {
        id: 'challenge-master',
        key: 'challenge-master',
        name: 'Challenge Master',
        description: 'Complete 50 challenges',
        icon: '🏆',
        category: 'CHALLENGES',
        xpReward: 500,
        criteria: { type: 'count', target: 50 },
    },
    {
        id: 'legend',
        key: 'legend',
        name: 'Legend',
        description: 'Complete 100 challenges',
        icon: '👑',
        category: 'CHALLENGES',
        xpReward: 1000,
        criteria: { type: 'count', target: 100 },
    },

    // Selectors
    {
        id: 'selector-novice',
        key: 'selector-novice',
        name: 'Selector Novice',
        description: 'Complete 5 CSS selector challenges',
        icon: '🎨',
        category: 'CHALLENGES',
        xpReward: 50,
        criteria: { type: 'count', target: 5, challengeType: 'CSS_SELECTOR' },
    },
    {
        id: 'selector-master',
        key: 'selector-master',
        name: 'Selector Master',
        description: 'Complete 20 CSS selector challenges',
        icon: '🎯',
        category: 'CHALLENGES',
        xpReward: 150,
        criteria: { type: 'count', target: 20, challengeType: 'CSS_SELECTOR' },
    },
    {
        id: 'xpath-explorer',
        key: 'xpath-explorer',
        name: 'XPath Explorer',
        description: 'Complete 5 XPath challenges',
        icon: '🔍',
        category: 'CHALLENGES',
        xpReward: 50,
        criteria: { type: 'count', target: 5, challengeType: 'XPATH_SELECTOR' },
    },

    // Playwright
    {
        id: 'automation-beginner',
        key: 'automation-beginner',
        name: 'Automation Beginner',
        description: 'Complete 5 Playwright challenges',
        icon: '🤖',
        category: 'CHALLENGES',
        xpReward: 75,
        criteria: { type: 'count', target: 5, challengeType: 'PLAYWRIGHT' },
    },
    {
        id: 'code-ninja',
        key: 'code-ninja',
        name: 'Code Ninja',
        description: 'Complete 20 JavaScript challenges',
        icon: '🥷',
        category: 'CHALLENGES',
        xpReward: 200,
        criteria: { type: 'count', target: 20, challengeType: 'JAVASCRIPT' },
    },

    // Streaks
    {
        id: 'on-fire',
        key: 'on-fire',
        name: 'On Fire!',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        category: 'STREAK',
        xpReward: 50,
        criteria: { type: 'streak', target: 3 },
    },
    {
        id: 'dedicated-learner',
        key: 'dedicated-learner',
        name: 'Dedicated Learner',
        description: 'Maintain a 7-day streak',
        icon: '📚',
        category: 'STREAK',
        xpReward: 100,
        criteria: { type: 'streak', target: 7 },
    },
    {
        id: 'unstoppable',
        key: 'unstoppable',
        name: 'Unstoppable',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        category: 'STREAK',
        xpReward: 500,
        criteria: { type: 'streak', target: 30 },
    },

    // XP & Level
    {
        id: 'first-thousand',
        key: 'first-thousand',
        name: 'First Thousand',
        description: 'Earn 1,000 XP',
        icon: '💎',
        category: 'XP',
        xpReward: 100,
        criteria: { type: 'xp', target: 1000 },
    },
    {
        id: 'xp-hunter',
        key: 'xp-hunter',
        name: 'XP Hunter',
        description: 'Earn 10,000 XP',
        icon: '💰',
        category: 'XP',
        xpReward: 500,
        criteria: { type: 'xp', target: 10000 },
    },
    {
        id: 'level-10',
        key: 'level-10',
        name: 'Level 10',
        description: 'Reach level 10',
        icon: '🌟',
        category: 'XP',
        xpReward: 200,
        criteria: { type: 'level', target: 10 },
    },
    {
        id: 'level-25',
        key: 'level-25',
        name: 'Quarter Century',
        description: 'Reach level 25',
        icon: '⭐',
        category: 'XP',
        xpReward: 500,
        criteria: { type: 'level', target: 25 },
    },

    // Tutorials
    {
        id: 'bookworm',
        key: 'bookworm',
        name: 'Bookworm',
        description: 'Complete 5 tutorials',
        icon: '📖',
        category: 'TUTORIALS',
        xpReward: 50,
        criteria: { type: 'count', target: 5 },
    },

    // Special
    {
        id: 'perfectionist',
        key: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 10 perfect scores',
        icon: '💯',
        category: 'SPECIAL',
        xpReward: 150,
        criteria: { type: 'special', target: 10 },
    },
];

/**
 * Check which achievements a user has unlocked based on their stats
 */
export function checkAchievements(
    stats: UserStats,
    alreadyEarned: Set<string>
): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
        // Skip if already earned
        if (alreadyEarned.has(achievement.id)) continue;

        const { criteria } = achievement;
        let earned = false;

        switch (criteria.type) {
            case 'count':
                if (criteria.challengeType) {
                    // Type-specific challenge count
                    const count = stats.challengesByType[criteria.challengeType] || 0;
                    earned = count >= criteria.target;
                } else if (achievement.category === 'TUTORIALS') {
                    earned = stats.tutorialsCompleted >= criteria.target;
                } else {
                    // Total challenge count
                    earned = stats.totalChallengesCompleted >= criteria.target;
                }
                break;

            case 'streak':
                earned = stats.currentStreak >= criteria.target ||
                    stats.longestStreak >= criteria.target;
                break;

            case 'xp':
                earned = stats.totalXP >= criteria.target;
                break;

            case 'level':
                earned = stats.level >= criteria.target;
                break;

            case 'special':
                if (achievement.id === 'perfectionist') {
                    earned = stats.perfectScores >= criteria.target;
                }
                break;
        }

        if (earned) {
            newAchievements.push(achievement);
        }
    }

    return newAchievements;
}

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(
    category: AchievementCategory
): Achievement[] {
    return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get user's progress toward an achievement
 */
export function getAchievementProgress(
    achievement: Achievement,
    stats: UserStats
): { current: number; target: number; percentage: number } {
    const { criteria } = achievement;
    let current = 0;

    switch (criteria.type) {
        case 'count':
            if (criteria.challengeType) {
                current = stats.challengesByType[criteria.challengeType] || 0;
            } else if (achievement.category === 'TUTORIALS') {
                current = stats.tutorialsCompleted;
            } else {
                current = stats.totalChallengesCompleted;
            }
            break;

        case 'streak':
            current = Math.max(stats.currentStreak, stats.longestStreak);
            break;

        case 'xp':
            current = stats.totalXP;
            break;

        case 'level':
            current = stats.level;
            break;

        case 'special':
            if (achievement.id === 'perfectionist') {
                current = stats.perfectScores;
            }
            break;
    }

    const percentage = Math.min(100, (current / criteria.target) * 100);

    return {
        current,
        target: criteria.target,
        percentage,
    };
}
