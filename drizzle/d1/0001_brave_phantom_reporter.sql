CREATE INDEX `idx_bug_reports_user` ON `bug_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_newsletter_confirmation` ON `newsletter_subscribers` (`confirmation_token`);--> statement-breakpoint
CREATE INDEX `idx_progress_challenge` ON `progress` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_progress_tutorial` ON `progress` (`tutorial_id`);--> statement-breakpoint
CREATE INDEX `idx_submissions_challenge` ON `submissions` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_submissions_user_created` ON `submissions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_user_achievements_achievement` ON `user_achievements` (`achievement_id`);--> statement-breakpoint
CREATE INDEX `idx_users_leaderboard` ON `users` (`show_on_leaderboard`,`xp`);