
import { db } from '../db';
import { tutorials } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getTutorialList, getTutorialContent } from '../server/content.server';

export async function syncTutorials() {
    console.log('🔄 Starting tutorial sync...');

    try {
        // 1. Get all tutorials from registry (source of truth for list)
        // using 'en' just to get the list, locale doesn't affect the list structure itself much
        const registryTutorials = await getTutorialList('en');
        console.log(`📂 Found ${registryTutorials.length} tutorials in registry.`);

        let updatedCount = 0;
        let createdCount = 0;

        for (const item of registryTutorials) {
            // Fetch content for both English and Indonesian
            const enContent = await getTutorialContent(item.slug, 'en');
            const idContent = await getTutorialContent(item.slug, 'id');

            if (!enContent) {
                console.warn(`⚠️ Could not load English content for ${item.slug}`);
                continue;
            }

            // Construct localized fields
            // Note: getTutorialContent falls back to EN if ID is missing, so we need to be careful
            // But for now, if ID content == EN content, it might mean fallback occurred.
            // However, the helper returns the localized strings. 
            // Ideally we want explicit distinction, but the server helper handles fallback.
            // We'll trust the server helper's output as what should be in the DB view.

            const title = {
                en: enContent.title,
                id: idContent ? idContent.title : enContent.title
            };



            // Check if exists in DB
            const existing = await db.query.tutorials.findFirst({
                where: eq(tutorials.slug, item.slug)
            });

            const tutorialData = {
                slug: item.slug,
                title,
                order: item.order,
                estimatedMinutes: item.estimatedMinutes,
                tags: item.tags,
                isPublished: true, // Assuming if it's in registry, it's published
                updatedAt: new Date()
            };

            if (existing) {
                // Update
                await db.update(tutorials)
                    .set(tutorialData)
                    .where(eq(tutorials.id, existing.id));
                updatedCount++;
            } else {
                // Create
                await db.insert(tutorials)
                    .values(tutorialData);
                createdCount++;
            }
        }

        console.log(`✅ Tutorial Sync Complete.`);
        console.log(`   - Created: ${createdCount}`);
        console.log(`   - Updated: ${updatedCount}`);

    } catch (error) {
        console.error('❌ Sync Failed:', error);
        throw error;
    }
}

// Run the sync


// Run if main module
if (import.meta.main) {
    syncTutorials()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
