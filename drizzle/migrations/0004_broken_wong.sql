ALTER TABLE "achievements" ALTER COLUMN "name" SET DATA TYPE jsonb USING jsonb_build_object('en', "name");--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "title" SET DATA TYPE jsonb USING jsonb_build_object('en', "title");--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "instructions" SET DATA TYPE jsonb USING jsonb_build_object('en', "instructions");--> statement-breakpoint
ALTER TABLE "tutorials" ALTER COLUMN "title" SET DATA TYPE jsonb USING jsonb_build_object('en', "title");--> statement-breakpoint
ALTER TABLE "tutorials" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");--> statement-breakpoint
ALTER TABLE "tutorials" ALTER COLUMN "content" SET DATA TYPE jsonb USING jsonb_build_object('en', "content");