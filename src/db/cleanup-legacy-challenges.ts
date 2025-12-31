/**
 * Clean up legacy dummy challenges from the database
 * Removes the 3 uncategorized challenges from original seed data
 */

import { db } from './index';
import { challenges } from './schema';
import { inArray } from 'drizzle-orm';

async function cleanupLegacyChallenges() {
    console.log('\n🧹 Cleaning up legacy dummy challenges...\n');
    console.log('='.repeat(60));

    const legacySlugs = [
        'select-the-button',           // CSS_SELECTOR - 25 XP
        'xpath-find-link',             // XPATH_SELECTOR - 50 XP  
        'click-the-button-playwright', // PLAYWRIGHT - 30 XP
    ];

    try {
        // First, let's see what we're deleting
        const toDelete = await db
            .select({
                slug: challenges.slug,
                title: challenges.title,
                type: challenges.type,
            })
            .from(challenges)
            .where(inArray(challenges.slug, legacySlugs));

        if (toDelete.length === 0) {
            console.log('✅ No legacy challenges found. Database is already clean!');
            return;
        }

        console.log('\n📋 Found legacy challenges to remove:');
        toDelete.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.title} (${c.slug}) - ${c.type}`);
        });

        // Delete them
        await db
            .delete(challenges)
            .where(inArray(challenges.slug, legacySlugs));

        console.log('\n' + '='.repeat(60));
        console.log(`✨ Successfully removed ${toDelete.length} legacy challenges!`);
        console.log('='.repeat(60));
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

cleanupLegacyChallenges()
    .then(() => {
        console.log('\n✅ Cleanup complete!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
