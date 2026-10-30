CREATE TABLE `app_control` (
	`key` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT false NOT NULL,
	CONSTRAINT "app_control_value_boolean" CHECK("app_control"."value" IN (0, 1))
);

--> statement-breakpoint
INSERT INTO app_control (key, value) VALUES ('writes_frozen', 0);
--> statement-breakpoint
CREATE TRIGGER freeze_users_insert
BEFORE INSERT ON "users"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_users_update
BEFORE UPDATE ON "users"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_users_delete
BEFORE DELETE ON "users"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_sessions_insert
BEFORE INSERT ON "sessions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_sessions_update
BEFORE UPDATE ON "sessions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_sessions_delete
BEFORE DELETE ON "sessions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_accounts_insert
BEFORE INSERT ON "accounts"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_accounts_update
BEFORE UPDATE ON "accounts"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_accounts_delete
BEFORE DELETE ON "accounts"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_verification_insert
BEFORE INSERT ON "verification"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_verification_update
BEFORE UPDATE ON "verification"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_verification_delete
BEFORE DELETE ON "verification"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_tutorials_insert
BEFORE INSERT ON "tutorials"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_tutorials_update
BEFORE UPDATE ON "tutorials"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_tutorials_delete
BEFORE DELETE ON "tutorials"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_challenges_insert
BEFORE INSERT ON "challenges"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_challenges_update
BEFORE UPDATE ON "challenges"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_challenges_delete
BEFORE DELETE ON "challenges"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_test_cases_insert
BEFORE INSERT ON "test_cases"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_test_cases_update
BEFORE UPDATE ON "test_cases"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_test_cases_delete
BEFORE DELETE ON "test_cases"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_submissions_insert
BEFORE INSERT ON "submissions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_submissions_update
BEFORE UPDATE ON "submissions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_submissions_delete
BEFORE DELETE ON "submissions"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_progress_insert
BEFORE INSERT ON "progress"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_progress_update
BEFORE UPDATE ON "progress"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_progress_delete
BEFORE DELETE ON "progress"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_achievements_insert
BEFORE INSERT ON "achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_achievements_update
BEFORE UPDATE ON "achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_achievements_delete
BEFORE DELETE ON "achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_user_achievements_insert
BEFORE INSERT ON "user_achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_user_achievements_update
BEFORE UPDATE ON "user_achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_user_achievements_delete
BEFORE DELETE ON "user_achievements"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_bug_reports_insert
BEFORE INSERT ON "bug_reports"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_bug_reports_update
BEFORE UPDATE ON "bug_reports"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_bug_reports_delete
BEFORE DELETE ON "bug_reports"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_newsletter_subscribers_insert
BEFORE INSERT ON "newsletter_subscribers"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_newsletter_subscribers_update
BEFORE UPDATE ON "newsletter_subscribers"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_newsletter_subscribers_delete
BEFORE DELETE ON "newsletter_subscribers"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_contact_messages_insert
BEFORE INSERT ON "contact_messages"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_contact_messages_update
BEFORE UPDATE ON "contact_messages"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_contact_messages_delete
BEFORE DELETE ON "contact_messages"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_reward_operations_insert
BEFORE INSERT ON "reward_operations"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_reward_operations_update
BEFORE UPDATE ON "reward_operations"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_reward_operations_delete
BEFORE DELETE ON "reward_operations"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_rate_limit_buckets_insert
BEFORE INSERT ON "rate_limit_buckets"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_rate_limit_buckets_update
BEFORE UPDATE ON "rate_limit_buckets"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
--> statement-breakpoint
CREATE TRIGGER freeze_rate_limit_buckets_delete
BEFORE DELETE ON "rate_limit_buckets"
WHEN (SELECT value FROM app_control WHERE key = 'writes_frozen') = 1
BEGIN
  SELECT RAISE(ABORT, 'Application writes are frozen');
END;
