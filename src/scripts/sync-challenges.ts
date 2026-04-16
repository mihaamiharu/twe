import { db } from '../db';
import { challenges, testCases } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getRawChallengeContent, getChallengeList, clearContentCaches } from '../server/content.server';
import { type TestCaseDefinition } from '../lib/content.types';

export async function syncChallenges() {
    console.log('🔄 Starting challenge sync...');

    // Clear cache to ensure we get fresh file content
    clearContentCaches();

    try {
        // 1. Get all challenges from filesystem
        const fsChallenges = await getChallengeList('en'); // Locale doesn't matter for list
        console.log(`📂 Found ${fsChallenges.length} challenges in filesystem.`);

        let updatedCount = 0;
        let createdCount = 0;

        // Pre-fetch all existing challenges to avoid N+1 queries
        const existingChallenges = await db.query.challenges.findMany({
            columns: {
                id: true,
                slug: true
            }
        });
        const existingMap = new Map(existingChallenges.map(c => [c.slug, c]));

        for (const item of fsChallenges) {
            const rawContent = await getRawChallengeContent(item.slug);

            if (!rawContent) {
                console.warn(`⚠️ Could not load raw content for ${item.slug}`);
                continue;
            }

            // Check if exists in DB
            const existing = existingMap.get(item.slug);

            const challengeData = {
                slug: rawContent.slug,
                title: rawContent.title,
                type: rawContent.type,
                difficulty: rawContent.difficulty,
                xpReward: rawContent.xpReward,
                order: rawContent.order,
                category: rawContent.category,
                tags: rawContent.tags,
                hints: rawContent.hints, // Sync hints
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
                        rawContent.testCases.map((tc: TestCaseDefinition, index: number) => ({
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
        }

        // 2. Handle Deletions (Unpublish content missing from FS)
        const fsSlugs = new Set(fsChallenges.map(c => c.slug));

        // Get all published challenges from DB
        const dbChallenges = await db.query.challenges.findMany({
            where: eq(challenges.isPublished, true),
            columns: { id: true, slug: true }
        });

        let unpublishedCount = 0;
        const toUnpublishIds: string[] = [];

        for (const dbChallenge of dbChallenges) {
            if (!fsSlugs.has(dbChallenge.slug)) {
                // Challenge exists in DB but not in FS -> Unpublish
                console.log(`🗑️  Marking deleted challenge for unpublish: ${dbChallenge.slug}`);
                toUnpublishIds.push(dbChallenge.id);
            }
        }

        if (toUnpublishIds.length > 0) {
            await db.update(challenges)
                .set({
                    isPublished: false,
                    updatedAt: new Date()
                })
                .where(inArray(challenges.id, toUnpublishIds));
            unpublishedCount = toUnpublishIds.length;
        }

        console.log(`✅ Sync Complete.`);
        console.log(`   - Created: ${createdCount}`);
        console.log(`   - Updated: ${updatedCount}`);
        console.log(`   - Unpublished: ${unpublishedCount}`);

    } catch (error) {
        console.error('❌ Sync Failed:', error);
        throw error;
    }
}

// Run the sync
if (import.meta.main) {
    syncChallenges()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
