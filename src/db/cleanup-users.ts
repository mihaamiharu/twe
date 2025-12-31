/**
 * Cleanup script - Deletes all users and their associated data
 * Run with: bun run src/db/cleanup-users.ts
 */

import { db } from './index';
import {
    users,
    sessions,
    accounts,
    submissions,
    progress,
    userAchievements,
    bugReports
} from './schema';

async function cleanupUsers() {
    console.log('🧹 Starting cleanup...\n');

    try {
        // Delete in order respecting foreign key constraints
        console.log('Deleting user achievements...');
        await db.delete(userAchievements);
        console.log('✓ User achievements deleted');

        // Progress references submissions (best_submission_id), so delete progress first
        console.log('Deleting progress...');
        await db.delete(progress);
        console.log('✓ Progress deleted');

        console.log('Deleting submissions...');
        await db.delete(submissions);
        console.log('✓ Submissions deleted');

        console.log('Deleting sessions...');
        await db.delete(sessions);
        console.log('✓ Sessions deleted');

        console.log('Deleting accounts...');
        await db.delete(accounts);
        console.log('✓ Accounts deleted');

        console.log('Deleting bug reports...');
        await db.delete(bugReports);
        console.log('✓ Bug reports deleted');

        console.log('Deleting users...');
        await db.delete(users);
        console.log('✓ Users deleted');

        console.log('\n✅ Cleanup complete! All users and related data have been deleted.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

await cleanupUsers();
