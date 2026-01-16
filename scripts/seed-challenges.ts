import { db } from '../src/db';
import { challenges, testCases } from '../src/db/schema';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

/* eslint-disable no-console, no-try-catch-finally */

const CHALLENGES_DIR = join(process.cwd(), 'content', 'challenges');

async function getChallengeFiles() {
  const files = await readdir(CHALLENGES_DIR);
  return files.filter((f) => f.endsWith('.json'));
}

async function loadChallengesFromFile(filename: string) {
  const filePath = join(CHALLENGES_DIR, filename);
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function seedChallenges() {
  console.log('🌱 Seeding challenges from JSON files to database...\n');

  const challengeFiles = await getChallengeFiles();
  let totalChallenges = 0;

  for (const file of challengeFiles) {
    const data = await loadChallengesFromFile(file);

    if (!data.challenges || !Array.isArray(data.challenges)) {
      console.log(`⚠️  Skipping ${file}: Invalid format`);
      continue;
    }

    for (const challenge of data.challenges) {
      totalChallenges++;

      try {
        await db
          .insert(challenges)
          .values({
            id: challenge.slug,
            slug: challenge.slug,
            title: challenge.title?.en || challenge.title,
            description: challenge.description?.en || challenge.description,
            type: challenge.type,
            difficulty: challenge.difficulty,
            xpReward: challenge.xpReward,
            order: challenge.order,
            instructions: challenge.instructions?.en || challenge.instructions,
            htmlContent: challenge.htmlContent || null,
            files: challenge.files || null, // VFS support for multi-page E2E
            starterCode: challenge.starterCode || null,
            category: challenge.category || null,
            tags: challenge.tags || [],
            isPublished: true,
            completionCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();

        if (challenge.testCases && Array.isArray(challenge.testCases)) {
          for (const [index, tc] of challenge.testCases.entries()) {
            await db
              .insert(testCases)
              .values({
                id: `${challenge.slug}-${index}`,
                challengeId: challenge.slug,
                description: tc.description?.en || tc.description,
                input: JSON.stringify(tc.input),
                expectedOutput: JSON.stringify(tc.expectedOutput),
                isHidden: tc.isHidden || false,
                order: index,
                createdAt: new Date(),
              })
              .onConflictDoNothing();
          }
        }

        console.log(`  ✅ Seeded: ${challenge.slug}`);
      } catch (error) {
        console.error(`  ❌ Failed to seed ${challenge.slug}:`, error);
      }
    }
  }

  console.log(`\n✅ Total challenges seeded: ${totalChallenges}`);
}

seedChallenges()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
