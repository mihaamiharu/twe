/**
 * PROPERLY fix duplicate H2 title in "Introduction to Web Selectors" tutorial
 */

import { db } from './index';
import { tutorials } from './schema';
import { eq } from 'drizzle-orm';

async function fixDuplicateTitleProperly() {
    console.log('\n🔧 Fixing duplicate title in Introduction to Web Selectors (PROPERLY)...\n');

    try {
        // Get the tutorial
        const [tutorial] = await db
            .select()
            .from(tutorials)
            .where(eq(tutorials.slug, 'introduction-to-web-selectors'));

        if (!tutorial) {
            console.log('❌ Tutorial not found');
            return;
        }

        console.log('✓ Found tutorial');
        console.log('Current content preview:');
        console.log(tutorial.content.substring(0, 500));
        console.log('\n--- Looking for patterns ---\n');

        // Try multiple patterns to catch the duplicate H2
        let updatedContent = tutorial.content;

        // Pattern 1: Exact match
        if (updatedContent.includes('## Introduction to Web Selectors')) {
            updatedContent = updatedContent.replace('## Introduction to Web Selectors\n\n', '');
            console.log('✓ Removed pattern 1: "## Introduction to Web Selectors"');
        }

        // Pattern 2: With extra line breaks
        if (updatedContent.includes('## Introduction to Web Selectors')) {
            updatedContent = updatedContent.replace(/##\s*Introduction to Web Selectors\s*\n+/g, '');
            console.log('✓ Removed pattern 2: with regex');
        }

        if (updatedContent === tutorial.content) {
            console.log('⚠️  No changes made - pattern not found');
            console.log('\nShowing first 600 chars:');
            console.log(tutorial.content.substring(0, 600));
            return;
        }

        // Update the tutorial
        await db
            .update(tutorials)
            .set({
                content: updatedContent,
                updatedAt: new Date(),
            })
            .where(eq(tutorials.slug, 'introduction-to-web-selectors'));

        console.log('\n✨ Updated content!');
        console.log('\nNew content preview:');
        console.log(updatedContent.substring(0, 500));
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

fixDuplicateTitleProperly()
    .then(() => {
        console.log('\n✅ Fix complete!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
