import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getUserStats } from '../lib/stats';
import { getUserSettings } from '../lib/user.fn';

// Mock the auth part or just copy the logic we want to test
async function testLoad() {
  console.log('🧪 Testing User Settings Load...');

  // 1. Create a temporary empty user
  const email = `test-${Date.now()}@example.com`;
  console.log(`Creating user: ${email}`);

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: 'Test No Activity',
      role: 'USER',
      xp: 0,
      level: 1,
      profileVisibility: 'PUBLIC',
      showOnLeaderboard: true,
    })
    .returning();

  console.log(`User created: ${user.id}`);

  try {
    console.log('Calling getUserStats...');
    const stats = await getUserStats(user.id);
    console.log('Stats loaded:', stats);

    // Now simulate the parts of getUserSettings that might fail
    // We can't easily call getUserSettings directly because of the `auth.api.getSession` call inside it
    // and we are running in a standalone script context.
    // So I'll replicate the core logic here.

    console.log('Replicating getUserSettings logic...');

    // LOGIC FROM user.fn.ts
    const completedChallenges = stats.totalChallengesCompleted;
    const completedTutorials = stats.tutorialsCompleted;

    // Achievements query...
    const userAchievementsList = []; // Empty for new user

    // Submissions query...
    const recentSubmissions = []; // Empty for new user

    // Heatmap query...
    const heatmapData = [];

    // XP Calc
    const currentLevel = user.level;
    const currentXP = user.xp;
    const xpForCurrentLevel = 100 * Math.pow(currentLevel - 1, 2);
    const xpForNextLevel = 100 * Math.pow(currentLevel, 2);
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const xpProgressPercentage = Math.round((xpProgress / xpNeeded) * 100);

    console.log('XP Calcs:', { xpProgress, xpNeeded, xpProgressPercentage });

    const activity = [...recentSubmissions, ...userAchievementsList].sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    console.log('Activity:', activity);

    console.log('✅ Success! Logic seems fine for empty user.');
  } catch (error) {
    console.error('❌ CRASHED:', error);
  } finally {
    await db.delete(users).where(eq(users.id, user.id));
    console.log('Cleanup done.');
    process.exit(0);
  }
}

testLoad();
