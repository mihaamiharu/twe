CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_accounts_provider_account` ON `accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`rarity` text DEFAULT 'COMMON' NOT NULL,
	`category` text NOT NULL,
	`requirement_type` text NOT NULL,
	`requirement_value` integer NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	`is_secret` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT "achievements_requirementValue_int32" CHECK("achievements"."requirement_value" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "achievements_xpReward_int32" CHECK("achievements"."xp_reward" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "achievements_isSecret_boolean" CHECK("achievements"."is_secret" IN (0, 1)),
	CONSTRAINT "achievements_name_json" CHECK("achievements"."name" IS NULL OR json_valid("achievements"."name")),
	CONSTRAINT "achievements_description_json" CHECK("achievements"."description" IS NULL OR json_valid("achievements"."description"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_slug_unique` ON `achievements` (`slug`);--> statement-breakpoint
CREATE TABLE `bug_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`reporter_email` text,
	`title` text NOT NULL,
	`severity` text DEFAULT 'MEDIUM' NOT NULL,
	`steps_to_reproduce` text NOT NULL,
	`expected_behavior` text NOT NULL,
	`actual_behavior` text NOT NULL,
	`page_url` text,
	`browser_info` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`admin_notes` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "bugReports_severity_enum" CHECK("bug_reports"."severity" IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
	CONSTRAINT "bugReports_status_enum" CHECK("bug_reports"."status" IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'CLOSED'))
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`difficulty` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`order` integer NOT NULL,
	`tutorial_id` text,
	`category` text,
	`tags` text,
	`hints` text,
	`is_published` integer DEFAULT false NOT NULL,
	`completion_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`tutorial_id`) REFERENCES `tutorials`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "challenges_xpReward_int32" CHECK("challenges"."xp_reward" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "challenges_order_int32" CHECK("challenges"."order" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "challenges_completionCount_int32" CHECK("challenges"."completion_count" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "challenges_isPublished_boolean" CHECK("challenges"."is_published" IN (0, 1)),
	CONSTRAINT "challenges_title_json" CHECK("challenges"."title" IS NULL OR json_valid("challenges"."title")),
	CONSTRAINT "challenges_tags_json" CHECK("challenges"."tags" IS NULL OR json_valid("challenges"."tags")),
	CONSTRAINT "challenges_hints_json" CHECK("challenges"."hints" IS NULL OR json_valid("challenges"."hints")),
	CONSTRAINT "challenges_type_enum" CHECK("challenges"."type" IN ('JAVASCRIPT', 'PLAYWRIGHT', 'CSS_SELECTOR', 'XPATH_SELECTOR', 'TYPESCRIPT')),
	CONSTRAINT "challenges_difficulty_enum" CHECK("challenges"."difficulty" IN ('EASY', 'MEDIUM', 'HARD'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenges_slug_unique` ON `challenges` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_challenges_published` ON `challenges` (`is_published`);--> statement-breakpoint
CREATE INDEX `idx_challenges_category` ON `challenges` (`category`);--> statement-breakpoint
CREATE INDEX `idx_challenges_difficulty` ON `challenges` (`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_challenges_type` ON `challenges` (`type`);--> statement-breakpoint
CREATE INDEX `idx_challenges_order` ON `challenges` (`order`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL,
	`admin_notes` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT "contactMessages_status_enum" CHECK("contact_messages"."status" IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`confirmation_token` text,
	`confirmed_at` integer,
	`unsubscribed_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT "newsletterSubscribers_status_enum" CHECK("newsletter_subscribers"."status" IN ('PENDING', 'CONFIRMED', 'UNSUBSCRIBED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tutorial_id` text,
	`challenge_id` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`last_accessed_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`attempts` integer DEFAULT 0,
	`best_submission_id` text,
	`used_hint` integer DEFAULT false NOT NULL,
	`hint_content` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tutorial_id`) REFERENCES `tutorials`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`best_submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "progress_attempts_int32" CHECK("progress"."attempts" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "progress_isCompleted_boolean" CHECK("progress"."is_completed" IN (0, 1)),
	CONSTRAINT "progress_usedHint_boolean" CHECK("progress"."used_hint" IN (0, 1)),
	CONSTRAINT "progress_exactly_one_entity" CHECK(("progress"."tutorial_id" IS NOT NULL) <> ("progress"."challenge_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `idx_progress_user_id` ON `progress` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `progress_user_tutorial_unique` ON `progress` (`user_id`,`tutorial_id`) WHERE "progress"."tutorial_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `progress_user_challenge_unique` ON `progress` (`user_id`,`challenge_id`) WHERE "progress"."challenge_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL,
	CONSTRAINT "rateLimitBuckets_count_int32" CHECK("rate_limit_buckets"."count" BETWEEN -2147483648 AND 2147483647)
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limit_expiry` ON `rate_limit_buckets` (`reset_at`);--> statement-breakpoint
CREATE TABLE `reward_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`target_id` text NOT NULL,
	`progress_id` text NOT NULL,
	`was_completed` integer NOT NULL,
	`first_completion` integer NOT NULL,
	`used_hint` integer NOT NULL,
	`xp_awarded` integer NOT NULL,
	`old_xp` integer NOT NULL,
	`eligible_achievements` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`progress_id`) REFERENCES `progress`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rewardOperations_xpAwarded_int32" CHECK("reward_operations"."xp_awarded" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "rewardOperations_oldXp_int32" CHECK("reward_operations"."old_xp" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "rewardOperations_wasCompleted_boolean" CHECK("reward_operations"."was_completed" IN (0, 1)),
	CONSTRAINT "rewardOperations_firstCompletion_boolean" CHECK("reward_operations"."first_completion" IN (0, 1)),
	CONSTRAINT "rewardOperations_usedHint_boolean" CHECK("reward_operations"."used_hint" IN (0, 1)),
	CONSTRAINT "rewardOperations_eligibleAchievements_json" CHECK("reward_operations"."eligible_achievements" IS NULL OR json_valid("reward_operations"."eligible_achievements"))
);
--> statement-breakpoint
CREATE INDEX `idx_reward_operations_user_created` ON `reward_operations` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expiry` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`code` text NOT NULL,
	`is_passed` integer NOT NULL,
	`xp_earned` integer DEFAULT 0 NOT NULL,
	`execution_time` integer,
	`tests_passed` integer NOT NULL,
	`tests_total` integer NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "submissions_xpEarned_int32" CHECK("submissions"."xp_earned" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "submissions_executionTime_int32" CHECK("submissions"."execution_time" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "submissions_testsPassed_int32" CHECK("submissions"."tests_passed" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "submissions_testsTotal_int32" CHECK("submissions"."tests_total" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "submissions_isPassed_boolean" CHECK("submissions"."is_passed" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_user_id` ON `submissions` (`user_id`);--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`description` text NOT NULL,
	`input` text,
	`expected_output` text,
	`is_hidden` integer DEFAULT false NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "testCases_order_int32" CHECK("test_cases"."order" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "testCases_isHidden_boolean" CHECK("test_cases"."is_hidden" IN (0, 1)),
	CONSTRAINT "testCases_input_json" CHECK("test_cases"."input" IS NULL OR json_valid("test_cases"."input")),
	CONSTRAINT "testCases_expectedOutput_json" CHECK("test_cases"."expected_output" IS NULL OR json_valid("test_cases"."expected_output"))
);
--> statement-breakpoint
CREATE INDEX `idx_test_cases_challenge` ON `test_cases` (`challenge_id`);--> statement-breakpoint
CREATE TABLE `tutorials` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`order` integer NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`tags` text,
	`is_published` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT "tutorials_order_int32" CHECK("tutorials"."order" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "tutorials_estimatedMinutes_int32" CHECK("tutorials"."estimated_minutes" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "tutorials_viewCount_int32" CHECK("tutorials"."view_count" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "tutorials_isPublished_boolean" CHECK("tutorials"."is_published" IN (0, 1)),
	CONSTRAINT "tutorials_title_json" CHECK("tutorials"."title" IS NULL OR json_valid("tutorials"."title")),
	CONSTRAINT "tutorials_tags_json" CHECK("tutorials"."tags" IS NULL OR json_valid("tutorials"."tags"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutorials_slug_unique` ON `tutorials` (`slug`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`award_operation_id` text,
	`unlocked_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`progress` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "userAchievements_progress_int32" CHECK("user_achievements"."progress" BETWEEN -2147483648 AND 2147483647)
);
--> statement-breakpoint
CREATE INDEX `idx_user_achievements_operation` ON `user_achievements` (`award_operation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievements_user_achievement_unique` ON `user_achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`image` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`profile_visibility` text DEFAULT 'PUBLIC' NOT NULL,
	`show_on_leaderboard` integer DEFAULT true NOT NULL,
	CONSTRAINT "users_xp_int32" CHECK("users"."xp" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "users_level_int32" CHECK("users"."level" BETWEEN -2147483648 AND 2147483647),
	CONSTRAINT "users_emailVerified_boolean" CHECK("users"."email_verified" IN (0, 1)),
	CONSTRAINT "users_showOnLeaderboard_boolean" CHECK("users"."show_on_leaderboard" IN (0, 1)),
	CONSTRAINT "users_role_enum" CHECK("users"."role" IN ('USER', 'ADMIN')),
	CONSTRAINT "users_profileVisibility_enum" CHECK("users"."profile_visibility" IN ('PUBLIC', 'PRIVATE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_identifier` ON `verification` (`identifier`);