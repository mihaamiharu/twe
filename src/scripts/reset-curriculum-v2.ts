import { getRuntimeEnv } from '#platform';
import { sql } from 'drizzle-orm';
import { db, closeDatabase } from '../db';
import { challenges, progress, userAchievements, users } from '../db/schema';

const CONFIRMATION_TOKEN = 'RESET_CURRICULUM_V2';

function assertExplicitConfirmation() {
  if (
    !process.argv.includes('--confirm') ||
    process.env['CURRICULUM_RESET_CONFIRM'] !== CONFIRMATION_TOKEN
  ) {
    throw new Error(
      `Refusing to reset learner state. Run with --confirm and CURRICULUM_RESET_CONFIRM=${CONFIRMATION_TOKEN}.`,
    );
  }
}

async function resetCurriculumV2() {
  assertExplicitConfirmation();

  if (getRuntimeEnv().APP_ENV !== 'local' && getRuntimeEnv().APP_ENV !== 'test')
    throw new Error('Learner resets are restricted to local/test D1.');
  console.log(
    'Resetting local D1 learner state; historical submissions are preserved.',
  );
  await db.batch([
    db.delete(userAchievements),
    db.delete(progress),
    db.update(users).set({ xp: 0, level: 1, updatedAt: new Date() }),
    db.update(challenges).set({ completionCount: 0, updatedAt: new Date() }),
  ]);

  const [progressResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(progress);
  const [achievementsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userAchievements);
  const remainingProgress = Number(progressResult?.count ?? 0);
  const remainingAchievements = Number(achievementsResult?.count ?? 0);

  console.log('Curriculum v2 learner-state reset completed.');
  console.log(`   - Remaining progress rows: ${remainingProgress}`);
  console.log(`   - Remaining user achievements: ${remainingAchievements}`);
  console.log('   - User XP and levels reset to 0 XP / level 1.');
  console.log('   - Challenge completion counters reset to 0.');
}

try {
  await resetCurriculumV2();
} finally {
  await closeDatabase();
}
