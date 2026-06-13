-- ============================================================================
-- DLock - Migration 003: Tags and password strength
-- Run after 002_activity_trash.sql.
-- ============================================================================

ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS strength_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_stored_accounts_tags
ON stored_accounts USING GIN (tags);
