-- Add files column to challenges and used_hint to progress (idempotent)
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "files" jsonb;
ALTER TABLE "progress" ADD COLUMN IF NOT EXISTS "used_hint" boolean DEFAULT false NOT NULL;