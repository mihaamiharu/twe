-- Add editable_files and preload_modules columns to challenges table
-- These columns support multi-file E2E challenges with Page Object Model patterns

ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "editable_files" jsonb;
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "preload_modules" jsonb;
