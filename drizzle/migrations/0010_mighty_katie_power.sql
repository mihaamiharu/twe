DO $$ BEGIN
 ALTER TYPE "public"."challenge_type" ADD VALUE 'TYPESCRIPT';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "editable_files" jsonb;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "preload_modules" jsonb;