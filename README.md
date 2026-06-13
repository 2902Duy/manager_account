# DLock / manager_account

Password/account manager with a React frontend, Express backend, and Supabase Postgres database.

## Project Structure

- `frontend/`: React + Vite app.
- `backend/`: Express API server.
- `backend/migration.sql`: migration for pinned accounts, trash, and activity logs.
- `backend/migration_v2.sql`: migration for tags and password strength.
- `backend/migration_v3_maintenance.sql`: cleanup function and optimized indexes.

## Supabase Tables

### `stored_accounts`

Stores the encrypted account records for each authenticated user.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | Primary key |
| `user_id` | `UUID` | References `auth.users(id)` |
| `account_type` | `TEXT` | Account category, for example Game, Work, Social |
| `account` | `TEXT` | Username or email |
| `password` | `TEXT` | Encrypted password payload |
| `information` | `TEXT` | Optional notes |
| `gmail_link` | `TEXT` | Optional recovery email/link |
| `created_at` | `TIMESTAMPTZ` | Defaults to `now()` |
| `is_pinned` | `BOOLEAN` | Pinned accounts appear first |
| `is_deleted` | `BOOLEAN` | Soft-delete flag |
| `deleted_at` | `TIMESTAMPTZ` | Trash timestamp |
| `tags` | `TEXT[]` | Account tags |
| `strength_score` | `INTEGER` | Password strength score, 0-100 |

RLS is enabled. The intended ownership policy is:

```sql
auth.uid() = user_id
```

### `activity_logs`

Stores account activity history.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `BIGSERIAL` | Primary key |
| `user_id` | `UUID` | References `auth.users(id)` |
| `account_id` | `BIGINT` | Related `stored_accounts.id`, nullable |
| `action` | `VARCHAR(50)` | `create`, `update`, `delete`, `restore`, etc. |
| `details` | `JSONB` | Extra event metadata |
| `created_at` | `TIMESTAMPTZ` | Defaults to `now()` |

## Recommended Indexes

These indexes match the current backend query patterns:

```sql
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
```

The tag index supports queries such as:

```sql
SELECT *
FROM stored_accounts
WHERE user_id = auth.uid()
  AND is_deleted = false
  AND tags @> ARRAY['work'];
```

## Supabase Cron Cleanup

Use Supabase Cron to keep storage small on the free plan without requiring the app to be opened.

Create the cleanup function:

```sql
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
```

Recommended cron job:

```cron
0 3 * * *
```

SQL snippet:

```sql
SELECT public.cleanup_old_data();
```

This keeps activity logs for 90 days and permanently removes trash items older than 30 days.

## Health Checks

The backend exposes public health endpoints for Render and uptime monitors:

- `GET /`
- `GET /health`

Both return HTTP 200 when the backend is running.
