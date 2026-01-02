/**
 * Database Seed Script
 * 
 * Seeds the database with sample data for development and testing.
 * Orchestrates specialized seeders to ensure consistent data state.
 * 
 * Run with: bun run db:seed
 */

import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { seedTutorials } from './seed-tutorials';
import { seedBasicChallenges } from './seed-basic-challenges';
import { seedBeginnerChallenges } from './seed-beginner-challenges';
import { seedIntermediateChallenges } from './seed-intermediate-challenges';
import { seedExpertChallenges } from './seed-expert-challenges';
import { seedAchievements } from './seed-achievements';
// Use dynamic imports or check if files exist for other tiers if they are not strictly required yet
// keeping it simple for now with the ones we verified exports for.

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // ============================================================================
        // 1. SYSTEM SETUP & USERS
        // ============================================================================
        console.log('\n👤 Creating sample user...');

        let sampleUser = (await db.insert(users).values({
            email: 'demo@testingwithekki.com',
            emailVerified: true,
            name: 'Demo User',
            xp: 250,
            level: 3,
            profileVisibility: 'PUBLIC',
            showOnLeaderboard: true,
        }).onConflictDoNothing().returning())[0];

        if (!sampleUser) {
            console.log('   User already exists, fetching...');
            [sampleUser] = await db.select().from(users).where(eq(users.email, 'demo@testingwithekki.com'));
        }

        if (sampleUser) {
            console.log(`   User: ${sampleUser.name} (${sampleUser.email})`);
        }

        // ============================================================================
        // 2. CONTENT SEEDING (Tutorials -> Challenges)
        // ============================================================================

        // Tutorials (Source of Truth)
        console.log('\n📚 Processing Tutorials...');
        await seedTutorials();

        // Challenges (Dependent on Tutorials)
        console.log('\n🎯 Processing Challenges...');
        await seedBasicChallenges();
        await seedBeginnerChallenges();
        await seedIntermediateChallenges();
        await seedExpertChallenges();

        // Achievements
        console.log('\n🏆 Processing Achievements...');
        await seedAchievements();

        // ============================================================================
        // DONE
        // ============================================================================
        console.log('\n✨ Seeding complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed database:', error);
        process.exit(1);
    });

