import { db } from '../db';
import { challenges, testCases } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getRawChallengeContent, getChallengeList } from '../server/content.server';

async function syncChallenges() {
    console.log('🔄 Starting challenge sync...');

    try {
        // 1. Get all challenges from filesystem
        const fsChallenges = await getChallengeList('en'); // Locale doesn't matter for list
        console.log(`📂 Found ${fsChallenges.length} challenges in filesystem.`);

        let updatedCount = 0;
        let createdCount = 0;

        for (const item of fsChallenges) {
            const rawContent = await getRawChallengeContent(item.slug);

            if (!rawContent) {
                console.warn(`⚠️ Could not load raw content for ${item.slug}`);
                continue;
            }

            // Check if exists in DB
            const existing = await db.query.challenges.findFirst({
                where: eq(challenges.slug, item.slug)
            });

            const challengeData = {
                slug: rawContent.slug,
                title: rawContent.title as any,
                description: rawContent.description as any,
                type: rawContent.type,
                difficulty: rawContent.difficulty,
                xpReward: rawContent.xpReward,
                order: rawContent.order,
                instructions: rawContent.instructions as any,
                htmlContent: rawContent.htmlContent,
                files: rawContent.files, // VFS support for multi-page E2E
                editableFiles: rawContent.editableFiles,
                preloadModules: rawContent.preloadModules,
                starterCode: rawContent.starterCode,
                category: rawContent.category,
                tags: rawContent.tags,
                isPublished: true,
                updatedAt: new Date()
            };

            if (existing) {
                // Update
                await db.update(challenges)
                    .set(challengeData)
                    .where(eq(challenges.id, existing.id));

                // Sync test cases? (Optional, but good practice)
                // For now, let's focus on healing the main metadata/titles
                updatedCount++;
            } else {
                // Create
                const [newChallenge] = await db.insert(challenges)
                    .values(challengeData)
                    .returning();

                // Insert test cases for new challenge
                if (rawContent.testCases && rawContent.testCases.length > 0) {
                    await db.insert(testCases).values(
                        rawContent.testCases.map((tc: any, index: number) => ({
                            challengeId: newChallenge.id,
                            description: tc.description,
                            input: tc.input,
                            expectedOutput: tc.expectedOutput,
                            isHidden: tc.isHidden || false,
                            order: index,
                        }))
                    );
                }
                createdCount++;
            }
            createdCount++;
        }

        // 2. Handle Deletions (Unpublish content missing from FS)
        const fsSlugs = new Set(fsChallenges.map(c => c.slug));

        // Get all published challenges from DB
        const dbChallenges = await db.query.challenges.findMany({
            where: eq(challenges.isPublished, true),
            columns: { id: true, slug: true }
        });

        let unpublishedCount = 0;

        for (const dbChallenge of dbChallenges) {
            if (!fsSlugs.has(dbChallenge.slug)) {
                // Challenge exists in DB but not in FS -> Unpublish
                console.log(`🗑️  Unpublishing deleted challenge: ${dbChallenge.slug}`);
                await db.update(challenges)
                    .set({
                        isPublished: false,
                        updatedAt: new Date()
                    })
                    .where(eq(challenges.id, dbChallenge.id));
                unpublishedCount++;
            }
        }

        console.log(`✅ Sync Complete.`);
        console.log(`   - Created: ${createdCount}`);
        console.log(`   - Updated: ${updatedCount}`);
        console.log(`   - Unpublished: ${unpublishedCount}`);

    } catch (error) {
        console.error('❌ Sync Failed:', error);
        process.exit(1);
    }
}

// Run the sync
syncChallenges()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
