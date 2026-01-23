-- Add rarity column to achievements (idempotent)
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "rarity" text DEFAULT 'COMMON' NOT NULL;