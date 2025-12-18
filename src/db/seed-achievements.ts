/**
 * Achievement Badges Seed Script
 * 
 * Seeds the database with achievement badges.
 * Run with: bun run db:seed:achievements
 */

import { db } from './index';
import { achievements } from './schema';
import { inArray } from 'drizzle-orm';

const achievementData = [
    // === First Steps ===
    {
        slug: 'first-challenge',
        name: 'First Steps',
        description: 'Complete your first challenge',
        icon: '🎯',
        category: 'milestones',
        requirementType: 'challenge_count',
        requirementValue: 1,
        xpReward: 50,
        isSecret: false,
    },
    {
        slug: 'first-tutorial',
        name: 'Eager Learner',
        description: 'Complete your first tutorial',
        icon: '📖',
        category: 'tutorials',
        requirementType: 'tutorial_count',
        requirementValue: 1,
        xpReward: 25,
        isSecret: false,
    },

    // === Challenge Count Milestones ===
    {
        slug: 'challenge-10',
        name: 'Getting Warmed Up',
        description: 'Complete 10 challenges',
        icon: '🔥',
        category: 'challenges',
        requirementType: 'challenge_count',
        requirementValue: 10,
        xpReward: 100,
        isSecret: false,
    },
    {
        slug: 'challenge-25',
        name: 'Challenge Accepted',
        description: 'Complete 25 challenges',
        icon: '⚡',
        category: 'challenges',
        requirementType: 'challenge_count',
        requirementValue: 25,
        xpReward: 200,
        isSecret: false,
    },
    {
        slug: 'challenge-50',
        name: 'Halfway Hero',
        description: 'Complete 50 challenges',
        icon: '🏆',
        category: 'challenges',
        requirementType: 'challenge_count',
        requirementValue: 50,
        xpReward: 500,
        isSecret: false,
    },
    {
        slug: 'challenge-88',
        name: 'Completionist',
        description: 'Complete all 88 challenges',
        icon: '👑',
        category: 'challenges',
        requirementType: 'challenge_count',
        requirementValue: 88,
        xpReward: 1000,
        isSecret: false,
    },

    // === XP Milestones ===
    {
        slug: 'xp-100',
        name: 'XP Starter',
        description: 'Earn 100 XP',
        icon: '✨',
        category: 'xp',
        requirementType: 'xp_total',
        requirementValue: 100,
        xpReward: 25,
        isSecret: false,
    },
    {
        slug: 'xp-500',
        name: 'XP Hunter',
        description: 'Earn 500 XP',
        icon: '💫',
        category: 'xp',
        requirementType: 'xp_total',
        requirementValue: 500,
        xpReward: 50,
        isSecret: false,
    },
    {
        slug: 'xp-1000',
        name: 'XP Collector',
        description: 'Earn 1000 XP',
        icon: '🌟',
        category: 'xp',
        requirementType: 'xp_total',
        requirementValue: 1000,
        xpReward: 100,
        isSecret: false,
    },
    {
        slug: 'xp-2500',
        name: 'XP Master',
        description: 'Earn 2500 XP',
        icon: '⭐',
        category: 'xp',
        requirementType: 'xp_total',
        requirementValue: 2500,
        xpReward: 200,
        isSecret: false,
    },
    {
        slug: 'xp-5000',
        name: 'XP Legend',
        description: 'Earn 5000 XP',
        icon: '🌠',
        category: 'xp',
        requirementType: 'xp_total',
        requirementValue: 5000,
        xpReward: 500,
        isSecret: false,
    },

    // === Tier Masters ===
    {
        slug: 'tier-basic-master',
        name: 'Selector Specialist',
        description: 'Complete all Basic tier challenges',
        icon: '🎨',
        category: 'tiers',
        requirementType: 'tier_basic_complete',
        requirementValue: 15,
        xpReward: 150,
        isSecret: false,
    },
    {
        slug: 'tier-beginner-master',
        name: 'JavaScript Hero',
        description: 'Complete all Beginner tier challenges',
        icon: '💛',
        category: 'tiers',
        requirementType: 'tier_beginner_complete',
        requirementValue: 23,
        xpReward: 200,
        isSecret: false,
    },
    {
        slug: 'tier-intermediate-master',
        name: 'Playwright Pro',
        description: 'Complete all Intermediate tier challenges',
        icon: '🎭',
        category: 'tiers',
        requirementType: 'tier_intermediate_complete',
        requirementValue: 32,
        xpReward: 300,
        isSecret: false,
    },
    {
        slug: 'tier-expert-master',
        name: 'Automation Expert',
        description: 'Complete all Expert tier challenges',
        icon: '🚀',
        category: 'tiers',
        requirementType: 'tier_expert_complete',
        requirementValue: 18,
        xpReward: 400,
        isSecret: false,
    },
];

async function seedAchievements() {
    console.log('🏆 Seeding Achievement Badges...\n');

    try {
        // Check for existing achievements
        const slugs = achievementData.map(a => a.slug);
        const existing = await db.select({ slug: achievements.slug })
            .from(achievements)
            .where(inArray(achievements.slug, slugs));

        if (existing.length > 0) {
            console.log(`   Found ${existing.length} existing achievements, updating...`);
            await db.delete(achievements).where(inArray(achievements.slug, slugs));
        }

        // Insert achievements
        for (const achievement of achievementData) {
            await db.insert(achievements).values(achievement);
            console.log(`   ✅ ${achievement.icon} ${achievement.name}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('✨ Achievement seeding complete!');
        console.log('='.repeat(50));
        console.log('📊 Summary:');
        console.log(`   • Total Badges: ${achievementData.length}`);
        console.log(`   • Categories: milestones, tutorials, challenges, xp, tiers`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

seedAchievements()
    .then(() => {
        console.log('\n🎉 Achievements seeded successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed achievements:', error);
        process.exit(1);
    });
