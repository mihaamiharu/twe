CREATE INDEX "idx_challenges_published" ON "challenges" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_challenges_category" ON "challenges" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_challenges_difficulty" ON "challenges" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_challenges_type" ON "challenges" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_challenges_order" ON "challenges" USING btree ("order");