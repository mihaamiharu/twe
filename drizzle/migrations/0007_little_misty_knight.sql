-- Add indexes to challenges table (idempotent)
CREATE INDEX IF NOT EXISTS "idx_challenges_published" ON "challenges" USING btree ("is_published");
CREATE INDEX IF NOT EXISTS "idx_challenges_category" ON "challenges" USING btree ("category");
CREATE INDEX IF NOT EXISTS "idx_challenges_difficulty" ON "challenges" USING btree ("difficulty");
CREATE INDEX IF NOT EXISTS "idx_challenges_type" ON "challenges" USING btree ("type");
CREATE INDEX IF NOT EXISTS "idx_challenges_order" ON "challenges" USING btree ("order");