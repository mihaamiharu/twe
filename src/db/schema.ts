import {
  sqliteTable,
  text,
  integer,
  check,
  index,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import type { LocalizedString, LocalizedArray } from '@/lib/content.types';

// ============================================================================
// ENUMS
// ============================================================================

const challengeTypeEnumValues = [
  'JAVASCRIPT',
  'PLAYWRIGHT',
  'CSS_SELECTOR',
  'XPATH_SELECTOR',
  'TYPESCRIPT',
] as const;
export const challengeTypeEnum = (name: string) =>
  text(name, { enum: challengeTypeEnumValues });

const userRoleEnumValues = ['USER', 'ADMIN'] as const;
export const userRoleEnum = (name: string) =>
  text(name, { enum: userRoleEnumValues });

const difficultyEnumValues = ['EASY', 'MEDIUM', 'HARD'] as const;
export const difficultyEnum = (name: string) =>
  text(name, { enum: difficultyEnumValues });

const profileVisibilityEnumValues = ['PUBLIC', 'PRIVATE'] as const;
export const profileVisibilityEnum = (name: string) =>
  text(name, { enum: profileVisibilityEnumValues });

// Bug reporting enums
const bugSeverityEnumValues = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const bugSeverityEnum = (name: string) =>
  text(name, { enum: bugSeverityEnumValues });

const bugReportStatusEnumValues = [
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'WONT_FIX',
  'CLOSED',
] as const;
export const bugReportStatusEnum = (name: string) =>
  text(name, { enum: bugReportStatusEnumValues });

const subscriberStatusEnumValues = [
  'PENDING',
  'CONFIRMED',
  'UNSUBSCRIBED',
] as const;
export const subscriberStatusEnum = (name: string) =>
  text(name, { enum: subscriberStatusEnumValues });

const contactMessageStatusEnumValues = [
  'NEW',
  'READ',
  'REPLIED',
  'ARCHIVED',
] as const;
export const contactMessageStatusEnum = (name: string) =>
  text(name, { enum: contactMessageStatusEnumValues });

// ============================================================================
// AUTHENTICATION TABLES (BetterAuth Integration)
// ============================================================================

export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
    name: text('name'),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),

    // Gamification fields
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),
    role: userRoleEnum('role').notNull().default('USER'),

    // Privacy settings
    profileVisibility: profileVisibilityEnum('profile_visibility')
      .notNull()
      .default('PUBLIC'),
    showOnLeaderboard: integer('show_on_leaderboard', { mode: 'boolean' })
      .notNull()
      .default(true),
  },
  (table) => ({
    leaderboardIdx: index('idx_users_leaderboard').on(
      table.showOnLeaderboard,
      table.xp,
    ),

    xpRange: check(
      'users_xp_int32',
      sql`${table.xp} BETWEEN -2147483648 AND 2147483647`,
    ),
    levelRange: check(
      'users_level_int32',
      sql`${table.level} BETWEEN -2147483648 AND 2147483647`,
    ),
    emailVerifiedBoolean: check(
      'users_emailVerified_boolean',
      sql`${table.emailVerified} IN (0, 1)`,
    ),
    showOnLeaderboardBoolean: check(
      'users_showOnLeaderboard_boolean',
      sql`${table.showOnLeaderboard} IN (0, 1)`,
    ),
    roleCheck: check(
      'users_role_enum',
      sql`${table.role} IN (${sql.join(
        userRoleEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
    profileVisibilityCheck: check(
      'users_profileVisibility_enum',
      sql`${table.profileVisibility} IN (${sql.join(
        profileVisibilityEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
  }),
);
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    userIdx: index('idx_sessions_user').on(table.userId),
    expiresIdx: index('idx_sessions_expiry').on(table.expiresAt),
  }),
);
export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(), // Provider's user ID
    providerId: text('provider_id').notNull(), // e.g., "google", "email"
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'), // For email/password auth
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    userIdx: index('idx_accounts_user').on(table.userId),
    providerIdx: index('idx_accounts_provider_account').on(
      table.providerId,
      table.accountId,
    ),
  }),
);
// Verification table for password reset and email verification tokens
export const verification = sqliteTable(
  'verification',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    identifier: text('identifier').notNull(), // email or user id
    value: text('value').notNull(), // token value
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    identifierIdx: index('idx_verification_identifier').on(table.identifier),
  }),
);
// ============================================================================
// CONTENT TABLES
// ============================================================================

export const tutorials = sqliteTable(
  'tutorials',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title', { mode: 'json' }).$type<LocalizedString>().notNull(), // { en: string, id: string }
    order: integer('order').notNull(), // Display order
    estimatedMinutes: integer('estimated_minutes').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>(), // Array of tags
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    orderRange: check(
      'tutorials_order_int32',
      sql`${table.order} BETWEEN -2147483648 AND 2147483647`,
    ),
    estimatedMinutesRange: check(
      'tutorials_estimatedMinutes_int32',
      sql`${table.estimatedMinutes} BETWEEN -2147483648 AND 2147483647`,
    ),
    viewCountRange: check(
      'tutorials_viewCount_int32',
      sql`${table.viewCount} BETWEEN -2147483648 AND 2147483647`,
    ),
    isPublishedBoolean: check(
      'tutorials_isPublished_boolean',
      sql`${table.isPublished} IN (0, 1)`,
    ),
    titleJson: check(
      'tutorials_title_json',
      sql`${table.title} IS NULL OR json_valid(${table.title})`,
    ),
    tagsJson: check(
      'tutorials_tags_json',
      sql`${table.tags} IS NULL OR json_valid(${table.tags})`,
    ),
  }),
);
export const challenges = sqliteTable(
  'challenges',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title', { mode: 'json' }).$type<LocalizedString>().notNull(),
    type: challengeTypeEnum('type').notNull(),
    difficulty: difficultyEnum('difficulty').notNull(),
    xpReward: integer('xp_reward').notNull(),
    order: integer('order').notNull(), // Display order

    // Relations
    tutorialId: text('tutorial_id').references(() => tutorials.id, {
      onDelete: 'set null',
    }),

    // Metadata
    category: text('category'), // e.g., 'css-basics', 'xpath-basics', 'css-advanced'
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    hints: text('hints', { mode: 'json' }).$type<LocalizedArray>(), // Progressive hints for the challenge (Localized)
    isPublished: integer('is_published', { mode: 'boolean' })
      .notNull()
      .default(false),
    completionCount: integer('completion_count').notNull().default(0),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    xpRewardRange: check(
      'challenges_xpReward_int32',
      sql`${table.xpReward} BETWEEN -2147483648 AND 2147483647`,
    ),
    orderRange: check(
      'challenges_order_int32',
      sql`${table.order} BETWEEN -2147483648 AND 2147483647`,
    ),
    completionCountRange: check(
      'challenges_completionCount_int32',
      sql`${table.completionCount} BETWEEN -2147483648 AND 2147483647`,
    ),
    isPublishedBoolean: check(
      'challenges_isPublished_boolean',
      sql`${table.isPublished} IN (0, 1)`,
    ),
    titleJson: check(
      'challenges_title_json',
      sql`${table.title} IS NULL OR json_valid(${table.title})`,
    ),
    tagsJson: check(
      'challenges_tags_json',
      sql`${table.tags} IS NULL OR json_valid(${table.tags})`,
    ),
    hintsJson: check(
      'challenges_hints_json',
      sql`${table.hints} IS NULL OR json_valid(${table.hints})`,
    ),
    typeCheck: check(
      'challenges_type_enum',
      sql`${table.type} IN (${sql.join(
        challengeTypeEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
    difficultyCheck: check(
      'challenges_difficulty_enum',
      sql`${table.difficulty} IN (${sql.join(
        difficultyEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
    publishedIdx: index('idx_challenges_published').on(table.isPublished),
    categoryIdx: index('idx_challenges_category').on(table.category),
    difficultyIdx: index('idx_challenges_difficulty').on(table.difficulty),
    typeIdx: index('idx_challenges_type').on(table.type),
    orderIdx: index('idx_challenges_order').on(table.order),
  }),
);

export const testCases = sqliteTable(
  'test_cases',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    input: text('input', { mode: 'json' }), // Test input data
    expectedOutput: text('expected_output', { mode: 'json' }), // Expected result
    isHidden: integer('is_hidden', { mode: 'boolean' })
      .notNull()
      .default(false), // Hidden test cases
    order: integer('order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    orderRange: check(
      'testCases_order_int32',
      sql`${table.order} BETWEEN -2147483648 AND 2147483647`,
    ),
    isHiddenBoolean: check(
      'testCases_isHidden_boolean',
      sql`${table.isHidden} IN (0, 1)`,
    ),
    inputJson: check(
      'testCases_input_json',
      sql`${table.input} IS NULL OR json_valid(${table.input})`,
    ),
    expectedOutputJson: check(
      'testCases_expectedOutput_json',
      sql`${table.expectedOutput} IS NULL OR json_valid(${table.expectedOutput})`,
    ),
    challengeIdx: index('idx_test_cases_challenge').on(table.challengeId),
  }),
);
// ============================================================================
// USER PROGRESS TABLES
// ============================================================================

export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id, { onDelete: 'cascade' }),

    code: text('code').notNull(), // User's submitted code
    isPassed: integer('is_passed', { mode: 'boolean' }).notNull(),
    xpEarned: integer('xp_earned').notNull().default(0),

    // Execution details
    executionTime: integer('execution_time'), // milliseconds
    testsPassed: integer('tests_passed').notNull(),
    testsTotal: integer('tests_total').notNull(),
    errorMessage: text('error_message'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    challengeIdx: index('idx_submissions_challenge').on(table.challengeId),
    userCreatedIdx: index('idx_submissions_user_created').on(
      table.userId,
      table.createdAt,
    ),

    xpEarnedRange: check(
      'submissions_xpEarned_int32',
      sql`${table.xpEarned} BETWEEN -2147483648 AND 2147483647`,
    ),
    executionTimeRange: check(
      'submissions_executionTime_int32',
      sql`${table.executionTime} BETWEEN -2147483648 AND 2147483647`,
    ),
    testsPassedRange: check(
      'submissions_testsPassed_int32',
      sql`${table.testsPassed} BETWEEN -2147483648 AND 2147483647`,
    ),
    testsTotalRange: check(
      'submissions_testsTotal_int32',
      sql`${table.testsTotal} BETWEEN -2147483648 AND 2147483647`,
    ),
    isPassedBoolean: check(
      'submissions_isPassed_boolean',
      sql`${table.isPassed} IN (0, 1)`,
    ),
    userIdIdx: index('idx_submissions_user_id').on(table.userId),
  }),
);

export const progress = sqliteTable(
  'progress',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tutorialId: text('tutorial_id').references(() => tutorials.id, {
      onDelete: 'cascade',
    }),
    challengeId: text('challenge_id').references(() => challenges.id, {
      onDelete: 'cascade',
    }),

    isCompleted: integer('is_completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),

    // For challenges
    attempts: integer('attempts').default(0),
    bestSubmissionId: text('best_submission_id').references(
      () => submissions.id,
    ),
    usedHint: integer('used_hint', { mode: 'boolean' })
      .notNull()
      .default(false), // Track AI hint usage for XP penalty
    hintContent: text('hint_content'), // Store the generated hint

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    challengeIdx: index('idx_progress_challenge').on(table.challengeId),
    tutorialIdx: index('idx_progress_tutorial').on(table.tutorialId),

    attemptsRange: check(
      'progress_attempts_int32',
      sql`${table.attempts} BETWEEN -2147483648 AND 2147483647`,
    ),
    isCompletedBoolean: check(
      'progress_isCompleted_boolean',
      sql`${table.isCompleted} IN (0, 1)`,
    ),
    usedHintBoolean: check(
      'progress_usedHint_boolean',
      sql`${table.usedHint} IN (0, 1)`,
    ),
    userIdIdx: index('idx_progress_user_id').on(table.userId),
    progressEntityCheck: check(
      'progress_exactly_one_entity',
      sql`(${table.tutorialId} IS NOT NULL) <> (${table.challengeId} IS NOT NULL)`,
    ),
    userTutorialUnique: uniqueIndex('progress_user_tutorial_unique')
      .on(table.userId, table.tutorialId)
      .where(sql`${table.tutorialId} IS NOT NULL`),
    userChallengeUnique: uniqueIndex('progress_user_challenge_unique')
      .on(table.userId, table.challengeId)
      .where(sql`${table.challengeId} IS NOT NULL`),
  }),
);

// ============================================================================
// GAMIFICATION TABLES
// ============================================================================

export const achievements = sqliteTable(
  'achievements',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name', { mode: 'json' }).$type<LocalizedString>().notNull(),
    description: text('description', { mode: 'json' })
      .$type<LocalizedString>()
      .notNull(),
    icon: text('icon').notNull(), // Icon name or emoji
    rarity: text('rarity').notNull().default('COMMON'), // COMMON, RARE, EPIC, LEGENDARY
    category: text('category').notNull(), // e.g., "challenges", "tutorials", "social"

    // Unlock criteria
    requirementType: text('requirement_type').notNull(), // e.g., "challenge_count", "xp_total"
    requirementValue: integer('requirement_value').notNull(),

    xpReward: integer('xp_reward').notNull().default(0),
    isSecret: integer('is_secret', { mode: 'boolean' })
      .notNull()
      .default(false), // Hidden until unlocked

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    requirementValueRange: check(
      'achievements_requirementValue_int32',
      sql`${table.requirementValue} BETWEEN -2147483648 AND 2147483647`,
    ),
    xpRewardRange: check(
      'achievements_xpReward_int32',
      sql`${table.xpReward} BETWEEN -2147483648 AND 2147483647`,
    ),
    isSecretBoolean: check(
      'achievements_isSecret_boolean',
      sql`${table.isSecret} IN (0, 1)`,
    ),
    nameJson: check(
      'achievements_name_json',
      sql`${table.name} IS NULL OR json_valid(${table.name})`,
    ),
    descriptionJson: check(
      'achievements_description_json',
      sql`${table.description} IS NULL OR json_valid(${table.description})`,
    ),
  }),
);
export const userAchievements = sqliteTable(
  'user_achievements',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),

    awardOperationId: text('award_operation_id'),
    unlockedAt: integer('unlocked_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    progress: integer('progress').default(0), // For progressive achievements
  },
  (table) => ({
    achievementIdx: index('idx_user_achievements_achievement').on(
      table.achievementId,
    ),

    operationIdx: index('idx_user_achievements_operation').on(
      table.awardOperationId,
    ),
    progressRange: check(
      'userAchievements_progress_int32',
      sql`${table.progress} BETWEEN -2147483648 AND 2147483647`,
    ),
    // Prevent duplicate user-achievement pairs
    userAchievementUnique: unique(
      'user_achievements_user_achievement_unique',
    ).on(table.userId, table.achievementId),
  }),
);

// ============================================================================
// BUG REPORTING
// ============================================================================

export const bugReports = sqliteTable(
  'bug_reports',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),

    // Reporter info
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reporterEmail: text('reporter_email'), // For anonymous reports

    // Bug details (QA-style)
    title: text('title').notNull(),
    severity: bugSeverityEnum('severity').notNull().default('MEDIUM'),
    stepsToReproduce: text('steps_to_reproduce').notNull(),
    expectedBehavior: text('expected_behavior').notNull(),
    actualBehavior: text('actual_behavior').notNull(),

    // Context
    pageUrl: text('page_url'),
    browserInfo: text('browser_info'),

    // Status tracking
    status: bugReportStatusEnum('status').notNull().default('NEW'),
    adminNotes: text('admin_notes'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    userIdx: index('idx_bug_reports_user').on(table.userId),

    severityCheck: check(
      'bugReports_severity_enum',
      sql`${table.severity} IN (${sql.join(
        bugSeverityEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
    statusCheck: check(
      'bugReports_status_enum',
      sql`${table.status} IN (${sql.join(
        bugReportStatusEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
  }),
);
// ============================================================================
// NEWSLETTER & CONTACT
// ============================================================================

export const newsletterSubscribers = sqliteTable(
  'newsletter_subscribers',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    email: text('email').notNull().unique(),
    status: subscriberStatusEnum('status').notNull().default('PENDING'),
    confirmationToken: text('confirmation_token'),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),
    unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    tokenIdx: index('idx_newsletter_confirmation').on(table.confirmationToken),

    statusCheck: check(
      'newsletterSubscribers_status_enum',
      sql`${table.status} IN (${sql.join(
        subscriberStatusEnumValues.map((value) => sql.raw("'" + value + "'")),
        sql`, `,
      )})`,
    ),
  }),
);
export const contactMessages = sqliteTable(
  'contact_messages',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: text('topic'),
    message: text('message').notNull(),
    status: contactMessageStatusEnum('status').notNull().default('NEW'),
    adminNotes: text('admin_notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`),
  },
  (table) => ({
    statusCheck: check(
      'contactMessages_status_enum',
      sql`${table.status} IN (${sql.join(
        contactMessageStatusEnumValues.map((value) =>
          sql.raw("'" + value + "'"),
        ),
        sql`, `,
      )})`,
    ),
  }),
);
// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  submissions: many(submissions),
  progress: many(progress),
  achievements: many(userAchievements),
  bugReports: many(bugReports),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many, one }) => ({
  testCases: many(testCases),
  submissions: many(submissions),
  progress: many(progress),
  tutorial: one(tutorials, {
    fields: [challenges.tutorialId],
    references: [tutorials.id],
  }),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  challenge: one(challenges, {
    fields: [testCases.challengeId],
    references: [challenges.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  tutorial: one(tutorials, {
    fields: [progress.tutorialId],
    references: [tutorials.id],
  }),
  challenge: one(challenges, {
    fields: [progress.challengeId],
    references: [challenges.id],
  }),
  bestSubmission: one(submissions, {
    fields: [progress.bestSubmissionId],
    references: [submissions.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

export const tutorialsRelations = relations(tutorials, ({ many }) => ({
  progress: many(progress),
  challenges: many(challenges),
}));

export const bugReportsRelations = relations(bugReports, ({ one }) => ({
  user: one(users, {
    fields: [bugReports.userId],
    references: [users.id],
  }),
}));

// Each mutation records its own reward result inside the same D1 batch.
export const rewardOperations = sqliteTable(
  'reward_operations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['tutorial', 'challenge'] }).notNull(),
    targetId: text('target_id').notNull(),
    progressId: text('progress_id')
      .notNull()
      .references(() => progress.id, { onDelete: 'cascade' }),
    wasCompleted: integer('was_completed', { mode: 'boolean' }).notNull(),
    firstCompletion: integer('first_completion', { mode: 'boolean' }).notNull(),
    usedHint: integer('used_hint', { mode: 'boolean' }).notNull(),
    xpAwarded: integer('xp_awarded').notNull(),
    oldXp: integer('old_xp').notNull(),
    eligibleAchievements: text('eligible_achievements', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    xpAwardedRange: check(
      'rewardOperations_xpAwarded_int32',
      sql`${table.xpAwarded} BETWEEN -2147483648 AND 2147483647`,
    ),
    oldXpRange: check(
      'rewardOperations_oldXp_int32',
      sql`${table.oldXp} BETWEEN -2147483648 AND 2147483647`,
    ),
    wasCompletedBoolean: check(
      'rewardOperations_wasCompleted_boolean',
      sql`${table.wasCompleted} IN (0, 1)`,
    ),
    firstCompletionBoolean: check(
      'rewardOperations_firstCompletion_boolean',
      sql`${table.firstCompletion} IN (0, 1)`,
    ),
    usedHintBoolean: check(
      'rewardOperations_usedHint_boolean',
      sql`${table.usedHint} IN (0, 1)`,
    ),
    eligibleAchievementsJson: check(
      'rewardOperations_eligibleAchievements_json',
      sql`${table.eligibleAchievements} IS NULL OR json_valid(${table.eligibleAchievements})`,
    ),
    userIdx: index('idx_reward_operations_user_created').on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const rateLimitBuckets = sqliteTable(
  'rate_limit_buckets',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    resetAt: integer('reset_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    countRange: check(
      'rateLimitBuckets_count_int32',
      sql`${table.count} BETWEEN -2147483648 AND 2147483647`,
    ),
    expiryIdx: index('idx_rate_limit_expiry').on(table.resetAt),
  }),
);
