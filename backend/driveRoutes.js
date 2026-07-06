const jwt = require('jsonwebtoken');

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
];
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const DEFAULT_ROOT_FOLDER = 'DLock';
const DEFAULT_IMAGE_FOLDER = 'Account Images';

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

const escapeDriveQueryValue = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

module.exports = function registerDriveRoutes({ app, supabase, authMiddleware, encrypt, decrypt, getResetRedirectOrigin }) {
  const getOAuthConfig = () => ({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });

  const getStateSecret = () => process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.ENCRYPTION_KEY;

  const ensureGoogleConfig = () => {
    const config = getOAuthConfig();
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      const err = new Error('Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET hoặc GOOGLE_REDIRECT_URI.');
      err.status = 500;
      throw err;
    }
    if (!getStateSecret()) {
      const err = new Error('Thiếu GOOGLE_OAUTH_STATE_SECRET hoặc ENCRYPTION_KEY.');
      err.status = 500;
      throw err;
    }
    return config;
  };

  const googleRequest = async (url, { accessToken, method = 'GET', headers = {}, body } = {}) => {
    if (typeof fetch !== 'function') {
      const err = new Error('Google Drive integration cần Node.js 18+ có global fetch.');
      err.status = 500;
      throw err;
    }

    const response = await fetch(url, {
      method,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body,
    });

    if (!response.ok) {
      const payload = await readJson(response);
      const err = new Error(payload.error_description || payload.error?.message || payload.error || `Google API error ${response.status}`);
      err.status = response.status >= 400 && response.status < 500 ? 400 : 502;
      throw err;
    }

    return response;
  };

  const exchangeCodeForTokens = async (code) => {
    const { clientId, clientSecret, redirectUri } = ensureGoogleConfig();
    const response = await googleRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    return readJson(response);
  };

  const refreshAccessToken = async (refreshToken) => {
    const { clientId, clientSecret } = ensureGoogleConfig();
    const response = await googleRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await readJson(response);
    if (!tokens.access_token) throw new Error('Google không trả access token.');
    return tokens.access_token;
  };

  const getGoogleEmail = async (accessToken) => {
    try {
      const response = await googleRequest('https://www.googleapis.com/oauth2/v2/userinfo', { accessToken });
      const profile = await readJson(response);
      return profile.email || null;
    } catch (err) {
      console.error('Could not fetch Google profile:', err.message);
      return null;
    }
  };

  const getConnection = async (userId) => {
    const { data, error } = await supabase
      .from('user_drive_connections')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  };

  const findDriveFolder = async (accessToken, name, parentId = 'root') => {
    const q = [
      `name = '${escapeDriveQueryValue(name)}'`,
      `mimeType = '${DRIVE_FOLDER_MIME}'`,
      'trashed = false',
      `'${escapeDriveQueryValue(parentId)}' in parents`,
    ].join(' and ');

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('spaces', 'drive');
    url.searchParams.set('fields', 'files(id,name)');
    url.searchParams.set('pageSize', '1');

    const response = await googleRequest(url.toString(), { accessToken });
    const payload = await readJson(response);
    return payload.files?.[0] || null;
  };

  const createDriveFolder = async (accessToken, name, parentId = 'root') => {
    const response = await googleRequest('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      accessToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] }),
    });
    return readJson(response);
  };

  const ensureDriveFolder = async (accessToken, name, parentId = 'root') => {
    const existing = await findDriveFolder(accessToken, name, parentId);
    return existing || createDriveFolder(accessToken, name, parentId);
  };

  app.get('/api/drive/auth-url', authMiddleware, async (req, res) => {
    try {
      const { clientId, redirectUri } = ensureGoogleConfig();
      const origin = getResetRedirectOrigin(req.headers.origin);
      const state = jwt.sign({ userId: req.user.id, origin }, getStateSecret(), { expiresIn: '10m' });
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: DRIVE_SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state,
      });
      res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    } catch (err) {
      console.error('Drive auth-url error:', err);
      res.status(err.status || 500).json({ error: err.message || 'Không tạo được liên kết Google Drive' });
    }
  });

  app.get('/api/drive/callback', async (req, res) => {
    let origin = getResetRedirectOrigin(req.headers.origin);
    try {
      const { code, state } = req.query;
      if (!code || !state) throw new Error('Thiếu mã xác thực Google Drive.');

      const payload = jwt.verify(state, getStateSecret());
      origin = payload.origin || origin;
      const tokens = await exchangeCodeForTokens(code);

      let refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        const existing = await getConnection(payload.userId);
        if (!existing?.refresh_token_encrypted) throw new Error('Google không trả refresh_token. Hãy kết nối lại với prompt consent.');
        refreshToken = decrypt(existing.refresh_token_encrypted);
      }

      const accessToken = tokens.access_token || await refreshAccessToken(refreshToken);
      const googleEmail = await getGoogleEmail(accessToken);
      const rootFolder = await ensureDriveFolder(accessToken, process.env.GOOGLE_DRIVE_ROOT_FOLDER || DEFAULT_ROOT_FOLDER, 'root');
      const imageFolder = await ensureDriveFolder(accessToken, process.env.GOOGLE_DRIVE_IMAGE_FOLDER || DEFAULT_IMAGE_FOLDER, rootFolder.id);

      const { error } = await supabase
        .from('user_drive_connections')
        .upsert([{
          user_id: payload.userId,
          google_email: googleEmail,
          refresh_token_encrypted: encrypt(refreshToken),
          scope: DRIVE_SCOPES.join(' '),
          root_folder_id: rootFolder.id,
          image_folder_id: imageFolder.id,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'user_id' });

      if (error) throw error;
      res.redirect(`${origin}/dashboard?drive=connected`);
    } catch (err) {
      console.error('Drive callback error:', err);
      res.redirect(`${origin}/dashboard?drive=error`);
    }
  });

  app.get('/api/drive/status', authMiddleware, async (req, res) => {
    try {
      const connection = await getConnection(req.user.id);
      if (!connection) return res.json({ connected: false });
      res.json({
        connected: true,
        google_email: connection.google_email,
        root_folder_id: connection.root_folder_id,
        image_folder_id: connection.image_folder_id,
        connected_at: connection.connected_at,
      });
    } catch (err) {
      console.error('Drive status error:', err);
      res.status(500).json({ error: 'Không kiểm tra được trạng thái Google Drive. Hãy chạy migration Drive nếu chưa có bảng user_drive_connections.' });
    }
  });

  app.delete('/api/drive/disconnect', authMiddleware, async (req, res) => {
    try {
      const connection = await getConnection(req.user.id);
      if (connection?.refresh_token_encrypted) {
        const refreshToken = decrypt(connection.refresh_token_encrypted);
        fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' }).catch(() => {});
      }

      const { error } = await supabase
        .from('user_drive_connections')
        .delete()
        .eq('user_id', req.user.id);
      if (error) throw error;

      res.json({ connected: false });
    } catch (err) {
      console.error('Drive disconnect error:', err);
      res.status(500).json({ error: 'Không ngắt được Google Drive' });
    }
  });
};
