-- ============================================================================
-- DLock - Migration 001: Initial account storage
-- Run in Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS stored_accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'Other',
  account TEXT NOT NULL,
  password TEXT NOT NULL,
  information TEXT,
  gmail_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stored_accounts_user_id
ON stored_accounts(user_id);

ALTER TABLE stored_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stored_accounts'
      AND policyname = 'user_owns_accounts'
  ) THEN
    CREATE POLICY "user_owns_accounts"
      ON stored_accounts
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
