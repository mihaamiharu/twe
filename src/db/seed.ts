/**
 * Database Seed Script
 * 
 * Seeds the database with sample data for development and testing.
 * Orchestrates specialized seeders to ensure consistent data state.
 * 
 * Run with: bun run db:seed
 */

import { db } from './index';
import {
    users,
    sessions,
    accounts,
    submissions,
    progress,
    userAchievements,
    bugReports,
    challenges,
    testCases
} from './schema';
import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth.server'; // Standard import
import { seedTutorials } from './seed-tutorials';
import { seedBasicChallenges } from './seed-basic-challenges';
import { seedBeginnerChallenges } from './seed-beginner-challenges';
import { seedIntermediateChallenges } from './seed-intermediate-challenges';
import { seedExpertChallenges } from './seed-expert-challenges';
import { seedAchievements } from './seed-achievements';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // ============================================================================
        // 0. CLEANUP USERS & DATA
        // ============================================================================
        console.log('\n🧹 Cleaning up existing users and data...');
        await db.delete(userAchievements);
        await db.delete(progress);
        await db.delete(submissions);
        await db.delete(sessions);
        await db.delete(accounts);
        await db.delete(bugReports);
        await db.delete(users);
        // Added deep cleanup
        await db.delete(testCases);
        await db.delete(challenges);
        console.log('   ✓ User and Content data cleared');

        // ============================================================================
        // 1. SYSTEM SETUP & USERS
        // ============================================================================
        console.log('\n👤 Creating seed users...');

        // 1. Admin User
        try {
            const adminRes = await auth.api.signUpEmail({
                body: {
                    email: 'admin@twe.com',
                    password: 'password123',
                    name: 'Admin User',
                }
            });

            if (adminRes && adminRes.user) {
                // Update to ADMIN role and level
                await db.update(users)
                    .set({
                        role: 'ADMIN',
                        xp: 1000,
                        level: 10,
                        showOnLeaderboard: false
                    })
                    .where(eq(users.id, adminRes.user.id));
                console.log(`   ✓ Created Admin: admin@twe.com (password: password123)`);
            }
        } catch (e) {
            console.error('Failed to create admin:', e);
        }

        // 2. Normal User
        try {
            const userRes = await auth.api.signUpEmail({
                body: {
                    email: 'user@twe.com',
                    password: 'password123',
                    name: 'Normal User',
                }
            });

            if (userRes && userRes.user) {
                await db.update(users)
                    .set({
                        role: 'USER',
                        xp: 0,
                        level: 1,
                        showOnLeaderboard: true
                    })
                    .where(eq(users.id, userRes.user.id));
                console.log(`   ✓ Created User: user@twe.com (password: password123)`);
            }
        } catch (e) {
            console.error('Failed to create user:', e);
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

