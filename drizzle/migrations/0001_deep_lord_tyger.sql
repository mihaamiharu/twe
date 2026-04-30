CREATE INDEX "idx_progress_user_id" ON "progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_user_id" ON "submissions" USING btree ("user_id");