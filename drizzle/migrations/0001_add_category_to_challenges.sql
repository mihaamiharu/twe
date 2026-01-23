-- Add category column to challenges table (idempotent)
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "category" text;