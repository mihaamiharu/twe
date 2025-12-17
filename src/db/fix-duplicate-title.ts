/**
 * Fix duplicate H2 title in "Introduction to Web Selectors" tutorial
 */

import { db } from './index';
import { tutorials } from './schema';
import { eq } from 'drizzle-orm';

async function fixDuplicateTitle() {
    console.log('\n🔧 Fixing duplicate title in Introduction to Web Selectors...\n');

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

        // Remove the duplicate H2 title
        const updatedContent = tutorial.content
            .replace(/## Introduction to Web Selectors\n\n/, '')  // Remove duplicate H2

        if (updatedContent === tutorial.content) {
            console.log('✓ No duplicate title found - already clean!');
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

        console.log('✨ Fixed duplicate title!');
        console.log('   Removed: "## Introduction to Web Selectors"');
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

fixDuplicateTitle()
    .then(() => {
        console.log('\n✅ Fix complete!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
