import { getRuntimeEnv } from '#platform';

function testDatabase() {
  if (
    getRuntimeEnv().APP_ENV !== 'test' ||
    !process.env['TWE_WRANGLER_CONFIG']?.includes('test-runs')
  )
    throw new Error(
      'Integration tests require the disposable D1 runner: bun run test:integration.',
    );
  return getRuntimeEnv().DB;
}

export async function setupTestDb() {
  await testDatabase().prepare('SELECT 1').first();
}

export async function teardownTestDb() {}

export async function truncateTables() {
  const database = testDatabase();
  // Child-first order, with FK enforcement kept on. Never ignore cleanup errors.
  const tables = [
    'reward_operations',
    'user_achievements',
    'progress',
    'submissions',
    'test_cases',
    'challenges',
    'tutorials',
    'achievements',
    'bug_reports',
    'sessions',
    'accounts',
    'verification',
    'contact_messages',
    'newsletter_subscribers',
    'users',
    'rate_limit_buckets',
  ];
  await database.batch(
    tables.map((table) => database.prepare(`DELETE FROM "${table}"`)),
  );
}
