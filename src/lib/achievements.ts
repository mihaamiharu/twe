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
        id: 'first-challenge',
        key: 'first-challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        icon: '🎯',
        category: 'CHALLENGES',
        xpReward: 50,
        criteria: { type: 'count', target: 1 },
    },

    {
        id: 'challenge-10',
        key: 'challenge-10',
        name: 'Getting Warmed Up',
        description: 'Complete 10 challenges',
        icon: '🔥',
        category: 'CHALLENGES',
        xpReward: 100,
        criteria: { type: 'count', target: 10 },
    },
    {
        id: 'challenge-25',
        key: 'challenge-25',
        name: 'Challenge Accepted',
        description: 'Complete 25 challenges',
        icon: '⚡',
        category: 'CHALLENGES',
        xpReward: 200,
        criteria: { type: 'count', target: 25 },
    },
    {
        id: 'challenge-50',
        key: 'challenge-50',
        name: 'Halfway Hero',
        description: 'Complete 50 challenges',
        icon: '🏆',
        category: 'CHALLENGES',
        xpReward: 500,
        criteria: { type: 'count', target: 50 },
    },
    {
        id: 'challenge-88',
        key: 'challenge-88',
        name: 'Completionist',
        description: 'Complete all 88 challenges',
        icon: '👑',
        category: 'CHALLENGES',
        xpReward: 1000,
        criteria: { type: 'count', target: 88 },
    },

    // Streak Milestones
    {
        id: 'streak-3',
        key: 'streak-3',
        name: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        category: 'STREAK',
        xpReward: 50,
        criteria: { type: 'streak', target: 3 },
    },
    {
        id: 'streak-7',
        key: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        category: 'STREAK',
        xpReward: 100,
        criteria: { type: 'streak', target: 7 },
    },
    {
        id: 'streak-14',
        key: 'streak-14',
        name: 'Two Week Champion',
        description: 'Maintain a 14-day streak',
        icon: '💪',
        category: 'STREAK',
        xpReward: 200,
        criteria: { type: 'streak', target: 14 },
    },
    {
        id: 'streak-30',
        key: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: '🏆',
        category: 'STREAK',
        xpReward: 500,
        criteria: { type: 'streak', target: 30 },
    },

    // XP Milestones (aligned with seed)
    {
        id: 'xp-100',
        key: 'xp-100',
        name: 'XP Starter',
        description: 'Earn 100 XP',
        icon: '✨',
        category: 'XP',
        xpReward: 25,
        criteria: { type: 'xp', target: 100 },
    },
    {
        id: 'xp-500',
        key: 'xp-500',
        name: 'XP Hunter',
        description: 'Earn 500 XP',
        icon: '💫',
        category: 'XP',
        xpReward: 50,
        criteria: { type: 'xp', target: 500 },
    },
    {
        id: 'xp-1000',
        key: 'xp-1000',
        name: 'XP Collector',
        description: 'Earn 1,000 XP',
        icon: '🌟',
        category: 'XP',
        xpReward: 100,
        criteria: { type: 'xp', target: 1000 },
    },
    {
        id: 'xp-2500',
        key: 'xp-2500',
        name: 'XP Master',
        description: 'Earn 2,500 XP',
        icon: '⭐',
        category: 'XP',
        xpReward: 200,
        criteria: { type: 'xp', target: 2500 },
    },
    {
        id: 'xp-5000',
        key: 'xp-5000',
        name: 'XP Legend',
        description: 'Earn 5,000 XP',
        icon: '🌠',
        category: 'XP',
        xpReward: 500,
        criteria: { type: 'xp', target: 5000 },
    },

    // Tier Masters (aligned with seed)
    {
        id: 'tier-basic-master',
        key: 'tier-basic-master',
        name: 'Selector Specialist',
        description: 'Complete all Basic tier challenges',
        icon: '🎨',
        category: 'CHALLENGES',
        xpReward: 150,
        criteria: { type: 'count', target: 15, challengeType: 'CSS_SELECTOR' },
    },
    {
        id: 'tier-beginner-master',
        key: 'tier-beginner-master',
        name: 'JavaScript Hero',
        description: 'Complete all Beginner tier challenges',
        icon: '💛',
        category: 'CHALLENGES',
        xpReward: 200,
        criteria: { type: 'count', target: 23, challengeType: 'JAVASCRIPT' },
    },
    {
        id: 'tier-intermediate-master',
        key: 'tier-intermediate-master',
        name: 'Playwright Pro',
        description: 'Complete all Intermediate tier challenges',
        icon: '🎭',
        category: 'CHALLENGES',
        xpReward: 300,
        criteria: { type: 'count', target: 32, challengeType: 'PLAYWRIGHT' },
    },
    {
        id: 'tier-expert-master',
        key: 'tier-expert-master',
        name: 'Automation Expert',
        description: 'Complete all Expert tier challenges',
        icon: '🚀',
        category: 'CHALLENGES',
        xpReward: 400,
        criteria: { type: 'count', target: 18, challengeType: 'PLAYWRIGHT' },
    },

    // Tutorials
    {
        id: 'first-tutorial', // Was first-tutorial in seed
        key: 'first-tutorial',
        name: 'Eager Learner',
        description: 'Complete your first tutorial',
        icon: '📖',
        category: 'TUTORIALS',
        xpReward: 25,
        criteria: { type: 'count', target: 1 },
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
