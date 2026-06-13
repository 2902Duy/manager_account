-- ============================================================================
-- DLock - Migration 004: Maintenance cleanup and query-matched indexes
-- Run after 003_tags_strength.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM activity_logs
  WHERE created_at < now() - interval '90 days';

  DELETE FROM stored_accounts
  WHERE is_deleted = true
    AND deleted_at < now() - interval '30 days';
$$;

DROP INDEX IF EXISTS idx_stored_accounts_deleted;
DROP INDEX IF EXISTS idx_stored_accounts_pinned;
DROP INDEX IF EXISTS idx_activity_logs_user;
DROP INDEX IF EXISTS idx_activity_logs_created;
DROP INDEX IF EXISTS idx_stored_accounts_user_id;

CREATE INDEX IF NOT EXISTS idx_stored_accounts_active_user_list
ON stored_accounts (user_id, is_pinned DESC, id DESC)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_stored_accounts_trash_user_deleted
ON stored_accounts (user_id, deleted_at DESC)
WHERE is_deleted = true;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
ON activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stored_accounts_tags
ON stored_accounts USING GIN (tags);
