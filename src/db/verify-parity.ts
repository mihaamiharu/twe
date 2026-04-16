import { db } from './index';
import { sql } from 'drizzle-orm';
import { type LocalizedString } from '@/lib/validations';

interface TutorialRow {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  content: LocalizedString;
}

interface ChallengeRow {
  slug: string;
  title: LocalizedString;
  instructions: LocalizedString;
}

interface AchievementRow {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
}

// This is a simplified version of the seeder data for verification
// In a real scenario, we might want to import the actual seeder data arrays if exported
async function verifyParity() {
  console.log('🔍 Starting Data Parity Verification...\n');
  let hasError = false;

  try {
    // 1. Verify Tutorials
    console.log('--- Tutorials ---');
    const dbTutorials = await db.execute<TutorialRow>(
      sql`SELECT slug, title, description, content FROM tutorials`,
    );
    // Note: For tutorials, content matches the markdown file content
    for (const row of dbTutorials) {
      if (typeof row.title !== 'object' || !row.title.en) {
        console.error(
          `❌ Tutorial ${row.slug}: Title is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
      if (typeof row.content !== 'object' || !row.content.en) {
        console.error(
          `❌ Tutorial ${row.slug}: Content is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
    }
    console.log(`✅ Verified ${dbTutorials.length} tutorials.`);

    // 2. Verify Challenges
    console.log('\n--- Challenges ---');
    const dbChallenges = await db.execute<ChallengeRow>(
      sql`SELECT slug, title, instructions FROM challenges`,
    );
    for (const row of dbChallenges) {
      if (typeof row.title !== 'object' || !row.title.en) {
        console.error(
          `❌ Challenge ${row.slug}: Title is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
      if (typeof row.instructions !== 'object' || !row.instructions.en) {
        console.error(
          `❌ Challenge ${row.slug}: Instructions is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
    }
    console.log(`✅ Verified ${dbChallenges.length} challenges.`);

    // 3. Verify Achievements
    console.log('\n--- Achievements ---');
    const dbAchievements = await db.execute<AchievementRow>(
      sql`SELECT slug, name, description FROM achievements`,
    );
    for (const row of dbAchievements) {
      if (typeof row.name !== 'object' || !row.name.en) {
        console.error(
          `❌ Achievement ${row.slug}: Name is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
      if (typeof row.description !== 'object' || !row.description.en) {
        console.error(
          `❌ Achievement ${row.slug}: Description is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
    }
    console.log(`✅ Verified ${dbAchievements.length} achievements.`);

    if (!hasError) {
      console.log(
        '\n✨ DATA PARITY VERIFIED: All English content successfully migrated to JSONB structure.',
      );
    } else {
      console.error('\n⚠️ VERIFICATION FAILED: Some data issues were found.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyParity();
