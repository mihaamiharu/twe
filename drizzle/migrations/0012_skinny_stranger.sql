-- Custom SQL migration file, put your code below! --
-- Remove any existing duplicate entries (keep the earliest unlocked achievement)
DELETE FROM user_achievements ua1
USING user_achievements ua2
WHERE ua1.user_id = ua2.user_id
  AND ua1.achievement_id = ua2.achievement_id
  AND ua1.unlocked_at > ua2.unlocked_at;
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_achievement_unique" UNIQUE("user_id","achievement_id");