
/**
 * Seed database with tutorials supporting Basic and Beginner tier challenges
 */

import { db } from './index';
import { tutorials } from './schema';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { eq, not, inArray } from 'drizzle-orm';

export async function seedTutorials() {
    console.log('\n📚 Seeding Basic tier tutorials...\n');
    console.log('='.repeat(60));

    const tutorialsData = [
        {
            slug: 'css-selectors-for-qa',
            title: 'CSS Selectors for QA Engineers',
            description: 'Master the art of writing robust, maintainable CSS selectors for test automation.',
            estimatedMinutes: 18,
            tags: ['css', 'selectors', 'qa', 'automation', 'testing', 'beginner'],
            contentFile: 'css-selectors-for-qa.md',
            order: 10,
        },
        {
            slug: 'xpath-for-test-automation',
            title: 'XPath for Test Automation',
            description: 'Master XPath selectors to unlock powerful DOM navigation capabilities that CSS cannot provide.',
            estimatedMinutes: 18,
            tags: ['xpath', 'selectors', 'automation', 'testing', 'beginner'],
            contentFile: 'xpath-for-test-automation.md',
            order: 11,
        },
        {
            slug: 'building-robust-test-selectors',
            title: 'Building Robust Test Selectors',
            description: 'Learn to write selectors that withstand UI changes and keep your test suite reliable.',
            estimatedMinutes: 12,
            tags: ['selectors', 'best-practices', 'testing', 'maintenance', 'qa', 'beginner'],
            contentFile: 'building-robust-test-selectors.md',
            order: 12,
        },
        {
            slug: 'selector-decision-framework',
            title: 'Selector Decision Framework',
            description: 'A practical guide to choosing between CSS and XPath selectors for maximum effectiveness.',
            estimatedMinutes: 10,
            tags: ['css', 'xpath', 'decision-making', 'best-practices', 'comparison', 'beginner'],
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
        {
            slug: 'playwright-navigation-actions',
            title: 'Playwright Navigation & Actions',
            description: 'Master page navigation and user interactions with Playwright.',
            estimatedMinutes: 15,
            tags: ['playwright', 'navigation', 'actions', 'intermediate'],
            contentFile: 'playwright-navigation-actions.md',
            order: 30,
        },
        {
            slug: 'playwright-locators',
            title: 'Playwright Locators',
            description: 'Master the art of finding elements with Playwright locator API.',
            estimatedMinutes: 12,
            tags: ['playwright', 'locators', 'selectors', 'intermediate'],
            contentFile: 'playwright-locators.md',
            order: 31,
        },
        {
            slug: 'playwright-assertions',
            title: 'Playwright Assertions',
            description: 'Verify your test expectations with Playwright assertions.',
            estimatedMinutes: 10,
            tags: ['playwright', 'assertions', 'expect', 'intermediate'],
            contentFile: 'playwright-assertions.md',
            order: 32,
        },
        {
            slug: 'playwright-waits',
            title: 'Playwright Wait Strategies',
            description: 'Master timing and synchronization in Playwright tests.',
            estimatedMinutes: 10,
            tags: ['playwright', 'waits', 'async', 'intermediate'],
            contentFile: 'playwright-waits.md',
            order: 33,
        },
        {
            slug: 'playwright-pom',
            title: 'Page Object Model',
            description: 'Design pattern for maintainable test automation.',
            estimatedMinutes: 12,
            tags: ['playwright', 'pom', 'patterns', 'advanced'],
            contentFile: 'playwright-pom.md',
            order: 40,
        },
        {
            slug: 'playwright-data-driven',
            title: 'Data-Driven Testing',
            description: 'Run tests with external data for comprehensive coverage.',
            estimatedMinutes: 10,
            tags: ['playwright', 'data-driven', 'parameterized', 'advanced'],
            contentFile: 'playwright-data-driven.md',
            order: 41,
        },
        {
            slug: 'playwright-advanced-patterns',
            title: 'Advanced Playwright Patterns',
            description: 'Production-ready testing patterns for expert automation.',
            estimatedMinutes: 15,
            tags: ['playwright', 'advanced', 'patterns', 'advanced'],
            contentFile: 'playwright-advanced-patterns.md',
            order: 42,
        },
        {
            slug: 'playwright-fixtures',
            title: 'Playwright Fixtures',
            description: 'Stop repeating yourself. Let the framework handle the setup with powerful dependency injection.',
            estimatedMinutes: 20,
            tags: ['playwright', 'fixtures', 'patterns', 'advanced'],
            contentFile: 'playwright-fixtures.md',
            order: 43,
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
                console.log(`   📝 Updating: ${tutorialMeta.title} `);
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
                console.log(`   ✅ Creating: ${tutorialMeta.title} `);
                await db.insert(tutorials).values({
                    ...tutorialMeta,
                    content,
                    isPublished: true,
                    viewCount: 0,
                });
            }
        }



        // Cleanup: Remove tutorials that are no longer in the seed list
        console.log('\n🧹 Cleaning up obsolete tutorials...');
        const validSlugs = tutorialsData.map(t => t.slug);
        const deleted = await db.delete(tutorials).where(not(inArray(tutorials.slug, validSlugs))).returning();

        if (deleted.length > 0) {
            console.log(`   🗑️  Deleted ${deleted.length} obsolete tutorials:`);
            deleted.forEach(t => console.log(`      - ${t.title} (${t.slug})`));
        } else {
            console.log('   ✅ No obsolete tutorials found.');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ Tutorial seeding complete!');
        console.log('='.repeat(60));
        console.log(`📊 Summary: `);
        console.log(`   - Total tutorials: ${tutorialsData.length} `);
        console.log(`   - Basic tier(Selectors): 4`);
        console.log(`   - Beginner tier(JS / DOM / Async): 3`);
        console.log('='.repeat(60));
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}



// Run the seed function if executed directly
if (import.meta.main) {
    seedTutorials()
        .then(() => {
            console.log('\n✅ Seeding complete!\n');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ Error:', err);
            process.exit(1);
        });
}
