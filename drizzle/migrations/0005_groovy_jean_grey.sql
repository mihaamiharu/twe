-- Add token expiration columns to accounts (idempotent)
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;