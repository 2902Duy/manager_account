-- ============================================================================
-- DLock - Migration 002: Pinned accounts, trash, and activity logs
-- Run after 001_initial.sql.
-- ============================================================================

ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_id BIGINT,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stored_accounts_deleted ON stored_accounts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_stored_accounts_pinned ON stored_accounts(is_pinned);
