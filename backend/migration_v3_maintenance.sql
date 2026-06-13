-- ============================================================================
-- DLock - Migration V3: Maintenance, cleanup, and query-matched indexes
-- Run this in Supabase SQL Editor after migration.sql and migration_v2.sql.
-- ============================================================================

-- Cleanup function for Supabase Cron.
-- Recommended cron schedule: 0 3 * * *
-- Cron SQL snippet: select public.cleanup_old_data();
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

-- Replace broad/low-value indexes with indexes that match backend queries.
DROP INDEX IF EXISTS idx_stored_accounts_deleted;
DROP INDEX IF EXISTS idx_stored_accounts_pinned;
DROP INDEX IF EXISTS idx_activity_logs_user;
DROP INDEX IF EXISTS idx_activity_logs_created;
DROP INDEX IF EXISTS idx_stored_accounts_user_id;

-- Active account list:
-- WHERE user_id = ? AND is_deleted = false
-- ORDER BY is_pinned DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_stored_accounts_active_user_list
ON stored_accounts (user_id, is_pinned DESC, id DESC)
WHERE is_deleted = false;

-- Trash list:
-- WHERE user_id = ? AND is_deleted = true
-- ORDER BY deleted_at DESC
CREATE INDEX IF NOT EXISTS idx_stored_accounts_trash_user_deleted
ON stored_accounts (user_id, deleted_at DESC)
WHERE is_deleted = true;

-- Activity log list:
-- WHERE user_id = ?
-- ORDER BY created_at DESC
-- LIMIT 50
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
ON activity_logs (user_id, created_at DESC);

-- Tag filtering support for queries using tags @> ARRAY['tag'].
CREATE INDEX IF NOT EXISTS idx_stored_accounts_tags
ON stored_accounts USING GIN (tags);
