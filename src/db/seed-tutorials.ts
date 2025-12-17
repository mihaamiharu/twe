/**
 * Seed database with tutorials supporting Basic and Beginner tier challenges
 */

import { db } from './index';
import { tutorials } from './schema';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { eq } from 'drizzle-orm';

async function seedTutorials() {
    console.log('\n📚 Seeding Basic tier tutorials...\n');
    console.log('='.repeat(60));

    const tutorialsData = [
        {
            slug: 'css-selectors-for-qa',
            title: 'CSS Selectors for QA Engineers',
            description: 'Master the art of writing robust, maintainable CSS selectors for test automation.',
            estimatedMinutes: 18,
            tags: ['css', 'selectors', 'qa', 'automation', 'testing'],
            contentFile: 'css-selectors-for-qa.md',
            order: 10,
        },
        {
            slug: 'xpath-for-test-automation',
            title: 'XPath for Test Automation',
            description: 'Master XPath selectors to unlock powerful DOM navigation capabilities that CSS cannot provide.',
            estimatedMinutes: 18,
            tags: ['xpath', 'selectors', 'automation', 'testing', 'advanced'],
            contentFile: 'xpath-for-test-automation.md',
            order: 11,
        },
        {
            slug: 'building-robust-test-selectors',
            title: 'Building Robust Test Selectors',
            description: 'Learn to write selectors that withstand UI changes and keep your test suite reliable.',
            estimatedMinutes: 12,
            tags: ['selectors', 'best-practices', 'testing', 'maintenance', 'qa'],
            contentFile: 'building-robust-test-selectors.md',
            order: 12,
        },
        {
            slug: 'selector-decision-framework',
            title: 'Selector Decision Framework',
            description: 'A practical guide to choosing between CSS and XPath selectors for maximum effectiveness.',
            estimatedMinutes: 10,
            tags: ['css', 'xpath', 'decision-making', 'best-practices', 'comparison'],
            contentFile: 'selector-decision-framework.md',
            order: 13,
        },
        // Beginner tier (JavaScript) tutorials
        {
            slug: 'javascript-fundamentals-for-qa',
            title: 'JavaScript Fundamentals for QA',
            description: 'Master the JavaScript essentials you need for test automation.',
            estimatedMinutes: 20,
            tags: ['javascript', 'fundamentals', 'qa', 'automation', 'beginner'],
            contentFile: 'javascript-fundamentals-for-qa.md',
            order: 20,
        },
        {
            slug: 'dom-manipulation-for-testing',
            title: 'DOM Manipulation for Testing',
            description: 'Learn to find and interact with DOM elements for test automation.',
            estimatedMinutes: 15,
            tags: ['javascript', 'dom', 'testing', 'automation', 'beginner'],
            contentFile: 'dom-manipulation-for-testing.md',
            order: 21,
        },
        {
            slug: 'async-await-basics',
            title: 'Async/Await Basics for Testing',
            description: 'Master asynchronous JavaScript for test automation.',
            estimatedMinutes: 12,
            tags: ['javascript', 'async', 'await', 'promises', 'beginner'],
            contentFile: 'async-await-basics.md',
            order: 22,
        },
    ];

    try {
        for (const tutorialData of tutorialsData) {
            const { contentFile, ...tutorialMeta } = tutorialData;

            // Read markdown content
            const contentPath = join(process.cwd(), 'tutorials', contentFile);
            const content = await readFile(contentPath, 'utf-8');

            // Check if tutorial exists
            const existing = await db
                .select()
                .from(tutorials)
                .where(eq(tutorials.slug, tutorialMeta.slug));

            if (existing.length > 0) {
                // Update existing
                console.log(`   📝 Updating: ${tutorialMeta.title}`);
                await db
                    .update(tutorials)
                    .set({
                        ...tutorialMeta,
                        content,
                        updatedAt: new Date(),
                    })
                    .where(eq(tutorials.slug, tutorialMeta.slug));
            } else {
                // Insert new
                console.log(`   ✅ Creating: ${tutorialMeta.title}`);
                await db.insert(tutorials).values({
                    ...tutorialMeta,
                    content,
                    isPublished: true,
                    viewCount: 0,
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ Tutorial seeding complete!');
        console.log('='.repeat(60));
        console.log(`📊 Summary:`);
        console.log(`   - Total tutorials: ${tutorialsData.length}`);
        console.log(`   - Basic tier (Selectors): 4`);
        console.log(`   - Beginner tier (JS/DOM/Async): 3`);
        console.log('='.repeat(60));
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

seedTutorials()
    .then(() => {
        console.log('\n✅ Seeding complete!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
