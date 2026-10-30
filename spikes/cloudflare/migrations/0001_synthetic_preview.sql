-- Synthetic-only schema for #249. This is not the production D1 schema in #251.
CREATE TABLE spike_users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  CHECK (email LIKE '%@example.invalid')
);
CREATE TABLE spike_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES spike_users(id) ON DELETE CASCADE
);
CREATE INDEX spike_sessions_user ON spike_sessions(user_id);
CREATE TABLE spike_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES spike_users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX spike_accounts_user ON spike_accounts(user_id);
CREATE TABLE spike_verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX spike_verification_identifier ON spike_verification(identifier);
CREATE TABLE spike_reward_ledger (
  event_id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES spike_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL CHECK (lesson_id IN ('lesson-a', 'lesson-b')),
  xp INTEGER NOT NULL CHECK (xp = 100)
);
CREATE UNIQUE INDEX spike_reward_once ON spike_reward_ledger(user_id, lesson_id);
CREATE TABLE spike_failure_guard (value INTEGER NOT NULL CHECK (value = 1));
