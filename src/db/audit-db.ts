/**
 * Quick script to audit database content
 */

import { db } from './index';
import { challenges, tutorials } from './schema';

async function audit() {
    console.log('\n📊 DATABASE CONTENT AUDIT\n');
    console.log('='.repeat(60));

    // Get all challenges
    const allChallenges = await db
        .select({
            order: challenges.order,
            title: challenges.title,
            type: challenges.type,
            difficulty: challenges.difficulty,
            category: challenges.category,
            xp: challenges.xpReward,
            slug: challenges.slug,
        })
        .from(challenges)
        .orderBy(challenges.order);

    // Get all tutorials
    const allTutorials = await db
        .select({
            order: tutorials.order,
            title: tutorials.title,
            slug: tutorials.slug,
            tags: tutorials.tags,
        })
        .from(tutorials)
        .orderBy(tutorials.order);

    console.log('\n📘 CHALLENGES');
    console.log('-'.repeat(60));
    console.log(`Total: ${allChallenges.length}\n`);

    // Group by category
    const byCategory = allChallenges.reduce((acc, c) => {
        const cat = c.category || 'uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(c);
        return acc;
    }, {} as Record<string, typeof allChallenges>);

    for (const [category, challs] of Object.entries(byCategory)) {
        console.log(`\n${category.toUpperCase()}`);
        challs.forEach((c, i) => {
            console.log(`  ${i + 1}. [${c.type.padEnd(15)}] ${c.title.padEnd(35)} (${c.xp} XP)`);
        });
    }

    // Group by type
    console.log('\n\nBY TYPE:');
    const byType = allChallenges.reduce((acc, c) => {
        if (!acc[c.type]) acc[c.type] = 0;
        acc[c.type]++;
        return acc;
    }, {} as Record<string, number>);

    for (const [type, count] of Object.entries(byType)) {
        console.log(`  ${type}: ${count}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📚 TUTORIALS');
    console.log('-'.repeat(60));
    console.log(`Total: ${allTutorials.length}\n`);

    allTutorials.forEach((t, i) => {
        const tags = t.tags?.join(', ') || 'no tags';
        console.log(`  ${i + 1}. ${t.title} (${tags})`);
    });

    console.log('\n' + '='.repeat(60));
}

audit()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
