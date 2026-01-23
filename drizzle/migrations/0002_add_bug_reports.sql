-- Bug reports table and enums (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."bug_report_status" AS ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."bug_severity" AS ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"reporter_email" text,
	"title" text NOT NULL,
	"severity" "bug_severity" DEFAULT 'MEDIUM' NOT NULL,
	"steps_to_reproduce" text NOT NULL,
	"expected_behavior" text NOT NULL,
	"actual_behavior" text NOT NULL,
	"page_url" text,
	"browser_info" text,
	"status" "bug_report_status" DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
    ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;