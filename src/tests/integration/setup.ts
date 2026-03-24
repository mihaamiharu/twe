import { sql } from 'drizzle-orm';
import { db } from '../../db';

export async function setupTestDb() {
  // Basic connectivity check and simple cleanup if needed
  // In a real scenario, we might run migrations here or truncate tables
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Test database connection successful');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

export async function teardownTestDb() {
  // Cleanup logic after tests
}

export async function truncateTables() {
  const tables = [
    'progress',
    'user_achievements',
    'submissions',
    'users',
    'test_cases',
    'challenges',
    'tutorials',
    'achievements',
  ];
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
    } catch {
      // Table might not exist yet if migrations haven't run
    }
  }
}
