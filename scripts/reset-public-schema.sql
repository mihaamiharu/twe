-- ⚠️ DANGER: This script will delete ALL data in your database.
-- Run this manually on your VPS only if you want to start fresh.
-- Usage: psql -d <database_name> -f scripts/reset-public-schema.sql

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
