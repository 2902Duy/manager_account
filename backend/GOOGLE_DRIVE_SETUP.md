# Google Drive image folder setup

This integration lets each signed-in user connect their own Google Drive account. On successful OAuth callback, the backend creates or reuses these folders in that user's Drive:

```text
DLock/
  Account Images/
```

The app also adds an image manager screen. It lists Drive images by date, uploads images into `Account Images`, and opens images in a fullscreen viewer.

## 1. Run the Supabase migration

Open Supabase SQL Editor and run `backend/migration_drive_storage.sql`.

This creates `user_drive_connections` and adds image metadata columns to `stored_accounts`.

## 2. Create a Google OAuth client

In Google Cloud Console:

1. Enable Google Drive API.
2. Create an OAuth Client ID, type: Web application.
3. Add the backend callback URL as an authorized redirect URI.

Local development:

```text
http://localhost:8000/api/drive/callback
```

Production example:

```text
https://your-backend-domain.com/api/drive/callback
```

## 3. Add backend environment variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/drive/callback
GOOGLE_OAUTH_STATE_SECRET=use-a-long-random-secret
```

Optional:

```env
GOOGLE_DRIVE_ROOT_FOLDER=DLock
GOOGLE_DRIVE_IMAGE_FOLDER=Account Images
JSON_BODY_LIMIT=12mb
```

`GOOGLE_OAUTH_STATE_SECRET` can be omitted if `ENCRYPTION_KEY` is already set, but a separate secret is cleaner.

## 4. Test flow

1. Sign in with a real account, not the local dev test token.
2. Open Settings.
3. Click Connect Drive.
4. Approve Google access.
5. Confirm the Drive section shows connected status.
6. Check Google Drive for `DLock / Account Images`.
7. Open the sidebar item `Quản lý ảnh`.
8. Upload one or more images.
9. Confirm the gallery groups images by date and opens images fullscreen.
