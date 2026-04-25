-- ═══════════════════════════════════════════
-- Account Vault — Migration: Pinned, Trash, Activity Log
-- Chạy trên Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Thêm cột is_pinned vào stored_accounts
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Thêm cột soft delete vào stored_accounts
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Tạo bảng Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_id BIGINT,
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stored_accounts_deleted ON stored_accounts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_stored_accounts_pinned ON stored_accounts(is_pinned);
