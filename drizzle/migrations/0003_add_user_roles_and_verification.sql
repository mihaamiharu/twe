-- User roles and verification table (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "tutorial_id" uuid;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'USER' NOT NULL;

DO $$ BEGIN
    ALTER TABLE "challenges" ADD CONSTRAINT "challenges_tutorial_id_tutorials_id_fk" 
    FOREIGN KEY ("tutorial_id") REFERENCES "public"."tutorials"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "challenges" DROP COLUMN IF EXISTS "hints";