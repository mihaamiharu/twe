CREATE TYPE "public"."course_review_status" AS ENUM('DRAFT', 'FINALIZED');--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"course_slug" text NOT NULL,
	"repository_url" text NOT NULL,
	"review_round" integer DEFAULT 1 NOT NULL,
	"status" "course_review_status" DEFAULT 'DRAFT' NOT NULL,
	"checkpoint_drafts" jsonb NOT NULL,
	"reviewer_notes" text,
	"final_feedback" text,
	"finalized_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_reviews_reviewer_id" ON "course_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_course_reviews_repository_url" ON "course_reviews" USING btree ("repository_url");