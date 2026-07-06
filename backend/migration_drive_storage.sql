-- Google Drive image storage for DLock
-- Run this in Supabase SQL Editor before enabling Google Drive image uploads.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_drive_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text,
  refresh_token_encrypted text NOT NULL,
  scope text NOT NULL,
  root_folder_id text,
  image_folder_id text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.stored_accounts
  ADD COLUMN IF NOT EXISTS image_drive_file_id text,
  ADD COLUMN IF NOT EXISTS image_name text,
  ADD COLUMN IF NOT EXISTS image_mime_type text;

CREATE INDEX IF NOT EXISTS idx_user_drive_connections_user_id
  ON public.user_drive_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_stored_accounts_image_drive_file_id
  ON public.stored_accounts(image_drive_file_id)
  WHERE image_drive_file_id IS NOT NULL;

ALTER TABLE public.user_drive_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own drive connection" ON public.user_drive_connections;
CREATE POLICY "Users can read own drive connection"
  ON public.user_drive_connections
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own drive connection" ON public.user_drive_connections;
CREATE POLICY "Users can delete own drive connection"
  ON public.user_drive_connections
  FOR DELETE
  USING (auth.uid() = user_id);
