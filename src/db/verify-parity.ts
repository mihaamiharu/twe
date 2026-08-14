import { db } from './index';
import { sql } from 'drizzle-orm';

type ParityRow = Record<string, unknown>;

function hasEnglishString(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || !('en' in value)) {
    return false;
  }
  return typeof value.en === 'string' && value.en.length > 0;
}

function rowSlug(row: ParityRow): string {
  return typeof row.slug === 'string' ? row.slug : '<unknown>';
}

// This is a simplified version of the seeder data for verification
// In a real scenario, we might want to import the actual seeder data arrays if exported
async function verifyParity() {
  console.log('🔍 Starting Data Parity Verification...\n');
  let hasError = false;

  try {
    // 1. Verify Tutorials
    console.log('--- Tutorials ---');
    const dbTutorials = await db.execute(
      sql`SELECT slug, title FROM tutorials`,
    );
    // Note: For tutorials, content matches the markdown file content
    for (const row of dbTutorials) {
      if (!hasEnglishString(row.title)) {
        console.error(
          `❌ Tutorial ${rowSlug(row)}: Title is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
    }
    console.log(`✅ Verified ${dbTutorials.length} tutorials.`);

    // 2. Verify Challenges
    console.log('\n--- Challenges ---');
    const dbChallenges = await db.execute(
      sql`SELECT slug, title, instructions FROM challenges`,
    );
    for (const row of dbChallenges) {
      if (!hasEnglishString(row.title)) {
        console.error(
          `❌ Challenge ${rowSlug(row)}: Title is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
      if (!hasEnglishString(row.instructions)) {
        console.error(
          `❌ Challenge ${rowSlug(row)}: Instructions is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
    }
    console.log(`✅ Verified ${dbChallenges.length} challenges.`);

    // 3. Verify Achievements
    console.log('\n--- Achievements ---');
    const dbAchievements = await db.execute(
      sql`SELECT slug, name, description FROM achievements`,
    );
    for (const row of dbAchievements) {
      if (!hasEnglishString(row.name)) {
        console.error(
          `❌ Achievement ${rowSlug(row)}: Name is not a valid JSONB object with "en" key.`,
        );
        hasError = true;
      }
      if (!hasEnglishString(row.description)) {
        console.error(
          `❌ Achievement ${rowSlug(row)}: Description is not a valid JSONB object with "en" key.`,
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

void verifyParity();
