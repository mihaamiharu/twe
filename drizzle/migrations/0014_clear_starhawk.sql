CREATE TYPE "public"."contact_message_status" AS ENUM('NEW', 'READ', 'REPLIED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('PENDING', 'CONFIRMED', 'UNSUBSCRIBED');--> statement-breakpoint
ALTER TYPE "public"."bug_report_status" ADD VALUE 'CLOSED';--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" "contact_message_status" DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'PENDING' NOT NULL,
	"confirmation_token" text,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
