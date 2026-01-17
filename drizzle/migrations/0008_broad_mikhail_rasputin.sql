ALTER TABLE "challenges" ADD COLUMN "files" jsonb;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "used_hint" boolean DEFAULT false NOT NULL;