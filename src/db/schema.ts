import {
    pgTable,
    text,
    timestamp,
    integer,
    boolean,
    uuid,
    pgEnum,
    jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const challengeTypeEnum = pgEnum('challenge_type', [
    'JAVASCRIPT',
    'PLAYWRIGHT',
    'CSS_SELECTOR',
    'XPATH_SELECTOR',
]);

export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD']);

export const profileVisibilityEnum = pgEnum('profile_visibility', [
    'PUBLIC',
    'PRIVATE',
]);

// ============================================================================
// AUTHENTICATION TABLES (BetterAuth Integration)
// ============================================================================

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name'),
    image: text('image'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    // Gamification fields
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),

    // Privacy settings
    profileVisibility: profileVisibilityEnum('profile_visibility')
        .notNull()
        .default('PUBLIC'),
    showOnLeaderboard: boolean('show_on_leaderboard').notNull().default(true),
});

export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(), // Provider's user ID
    providerId: text('provider_id').notNull(), // e.g., "google", "email"
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    expiresAt: timestamp('expires_at'),
    scope: text('scope'),
    password: text('password'), // For email/password auth
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// CONTENT TABLES
// ============================================================================

export const tutorials = pgTable('tutorials', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(), // Markdown content
    order: integer('order').notNull(), // Display order
    estimatedMinutes: integer('estimated_minutes').notNull(),
    tags: text('tags').array(), // Array of tags
    isPublished: boolean('is_published').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const challenges = pgTable('challenges', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    type: challengeTypeEnum('type').notNull(),
    difficulty: difficultyEnum('difficulty').notNull(),
    xpReward: integer('xp_reward').notNull(),
    order: integer('order').notNull(), // Display order

    // Challenge content
    instructions: text('instructions').notNull(), // Detailed instructions
    htmlContent: text('html_content'), // For selector challenges
    starterCode: text('starter_code'), // For JavaScript/Playwright challenges
    hints: jsonb('hints').$type<string[]>(), // Array of hints

    // Metadata
    category: text('category'), // e.g., 'css-basics', 'xpath-basics', 'css-advanced'
    tags: text('tags').array(),
    isPublished: boolean('is_published').notNull().default(false),
    completionCount: integer('completion_count').notNull().default(0),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


export const testCases = pgTable('test_cases', {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id')
        .notNull()
        .references(() => challenges.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    input: jsonb('input'), // Test input data
    expectedOutput: jsonb('expected_output'), // Expected result
    isHidden: boolean('is_hidden').notNull().default(false), // Hidden test cases
    order: integer('order').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// USER PROGRESS TABLES
// ============================================================================

export const submissions = pgTable('submissions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    challengeId: uuid('challenge_id')
        .notNull()
        .references(() => challenges.id, { onDelete: 'cascade' }),

    code: text('code').notNull(), // User's submitted code
    isPassed: boolean('is_passed').notNull(),
    xpEarned: integer('xp_earned').notNull().default(0),

    // Execution details
    executionTime: integer('execution_time'), // milliseconds
    testsPassed: integer('tests_passed').notNull(),
    testsTotal: integer('tests_total').notNull(),
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const progress = pgTable('progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    tutorialId: uuid('tutorial_id').references(() => tutorials.id, {
        onDelete: 'cascade',
    }),
    challengeId: uuid('challenge_id').references(() => challenges.id, {
        onDelete: 'cascade',
    }),

    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    lastAccessedAt: timestamp('last_accessed_at').notNull().defaultNow(),

    // For tutorials
    readingProgress: integer('reading_progress').default(0), // Percentage

    // For challenges
    attempts: integer('attempts').default(0),
    bestSubmissionId: uuid('best_submission_id').references(() => submissions.id),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// GAMIFICATION TABLES
// ============================================================================

export const achievements = pgTable('achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(), // Icon name or emoji
    category: text('category').notNull(), // e.g., "challenges", "tutorials", "social"

    // Unlock criteria
    requirementType: text('requirement_type').notNull(), // e.g., "challenge_count", "xp_total"
    requirementValue: integer('requirement_value').notNull(),

    xpReward: integer('xp_reward').notNull().default(0),
    isSecret: boolean('is_secret').notNull().default(false), // Hidden until unlocked

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userAchievements = pgTable('user_achievements', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
        .notNull()
        .references(() => achievements.id, { onDelete: 'cascade' }),

    unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
    progress: integer('progress').default(0), // For progressive achievements
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    submissions: many(submissions),
    progress: many(progress),
    achievements: many(userAchievements),
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

export const challengesRelations = relations(challenges, ({ many }) => ({
    testCases: many(testCases),
    submissions: many(submissions),
    progress: many(progress),
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
}));
