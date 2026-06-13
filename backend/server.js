// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();
const crypto = require('crypto');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 8000;

// ─────────────────────────────────────────
// Supabase clients
// ─────────────────────────────────────────

// service_role: bypass RLS, dùng cho các CRUD routes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// anon key: dùng cho auth operations (signInWithPassword, signInWithOtp, v.v.)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────
// Encryption Helpers (AES-256-GCM, with CBC legacy decrypt)
// ─────────────────────────────────────────
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ LỖI NGHIÊM TRỌNG: Thiếu biến môi trường ENCRYPTION_KEY!');
  console.error('Vui lòng cấu hình ENCRYPTION_KEY trong Dashboard của Render.');
  process.exit(1);
}

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
if (ENCRYPTION_KEY.length !== 32) {
  console.error('ENCRYPTION_KEY must be 32 bytes hex encoded.');
  process.exit(1);
}
const IV_LENGTH = 12;
const LEGACY_IV_LENGTH = 16;
const GCM_PREFIX = 'gcm:v1';

const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [GCM_PREFIX, iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
};

const decrypt = (text) => {
  try {
    if (!text || !text.includes(':')) return text;
    if (text.startsWith(`${GCM_PREFIX}:`)) {
      const [, , ivHex, tagHex, encryptedHex] = text.split(':');
      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(Buffer.from(encryptedHex, 'hex'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    if (iv.length !== LEGACY_IV_LENGTH) throw new Error('Invalid legacy IV length');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('❌ Lỗi giải mã mật khẩu (Có thể do sai ENCRYPTION_KEY):', err.message);
    return '[Lỗi giải mã - Sai Key]';
  }
};

// ─────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────
const accountSchema = z.object({
  account_type: z.string().min(1, 'Loại tài khoản không được để trống'),
  account: z.string().min(1, 'Tên tài khoản không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  information: z.string().optional().nullable(),
  gmail_link: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  strength_score: z.number().optional().default(0),
});

const accountUpdateSchema = accountSchema.extend({
  password: z.string().optional(),
});

const getZodMessage = (err) => err.issues?.[0]?.message || err.errors?.[0]?.message || 'Du lieu khong hop le';

const getAccountWriteErrorMessage = (error, action) => {
  const rawMessage = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes('tags') || lowerMessage.includes('strength_score')) {
    return 'Database chua co cot tags/strength_score. Hay chay backend/migration_v2.sql trong Supabase SQL Editor.';
  }

  return `Loi khi ${action}: ${error?.message || 'Khong the ghi du lieu'}`;
};

// Helper tính điểm sức khỏe mật khẩu (bản backend)
const calculateStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return score;
};

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────

// Hỗ trợ nhiều origin cách nhau bởi dấu phẩy, tự thêm https:// nếu thiếu
const normalizeOrigin = (origin) => {
  if (!origin) return '';
  let normalized = origin.trim().replace(/\/+$/, '');
  if (normalized && !normalized.startsWith('http')) normalized = 'https://' + normalized;
  return normalized;
};

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN || '').split(',').map(normalizeOrigin),
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

const isAllowedOrigin = (origin) => allowedOrigins.includes(normalizeOrigin(origin));

const getResetRedirectOrigin = (origin) => {
  const normalized = normalizeOrigin(origin);
  if (normalized && isAllowedOrigin(normalized)) return normalized;
  const configuredOrigin = (process.env.CORS_ORIGIN || '').split(',').map(normalizeOrigin).find(Boolean);
  return configuredOrigin || 'http://localhost:5173';
};

app.use(cors({
  origin: (origin, cb) => {
    // Không có origin (server-to-server, Postman) → cho phép
    if (!origin) return cb(null, true);
    // Kiểm tra danh sách cho phép
    if (isAllowedOrigin(origin)) return cb(null, true);
    // Tự động cho phép mọi *.vercel.app subdomain
    console.log('❌ CORS blocked origin:', origin);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Public health endpoints for uptime monitors and Render keep-alive pings.
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'DLock API' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth Middleware: verify Supabase JWT
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Chưa đăng nhập' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });

  req.user = user;
  next();
};

// ─────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────

// [POST] /api/auth/signup — Đăng ký tài khoản mới
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Cần nhập email và mật khẩu' });

  const { data, error } = await supabaseAuth.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.' });
});

// [POST] /api/auth/login — Đăng nhập bằng email + mật khẩu, trả về session luôn
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Cần nhập email và mật khẩu' });

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

  res.json({
    access_token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

// [POST] /api/auth/verify-otp — Bước 2: Xác minh OTP, trả về session
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: 'Cần nhập email và mã OTP' });

  const { data, error } = await supabaseAuth.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });

  res.json({
    access_token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

// [POST] /api/auth/resend-otp — Gửi lại OTP (dùng khi user chưa nhận được)
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Cần nhập email' });

  const { error } = await supabaseAuth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) return res.status(500).json({ error: 'Không thể gửi lại OTP: ' + error.message });

  res.json({ message: 'OTP mới đã được gửi!' });
});

// [POST] /api/auth/forgot-password — Gửi email reset mật khẩu
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Cần nhập email' });

    // Làm sạch origin để tránh lỗi thừa dấu /
    const origin = getResetRedirectOrigin(req.headers.origin);
    const redirectTo = `${origin}/reset-password`;

    console.log('📬 Đang gửi yêu cầu Reset Password:');
    console.log(' - Email:', email);
    console.log(' - RedirectTo:', redirectTo);

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error('❌ Supabase Auth Error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hòm thư!' });
  } catch (err) {
    console.error('🔥 Server Error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// [POST] /api/auth/reset-password — Đặt lại mật khẩu mới
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { password, hash } = req.body;
    if (!password) return res.status(400).json({ error: 'Cần nhập mật khẩu mới' });

    // Lấy access_token và refresh_token từ hash
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      return res.status(400).json({ error: 'Phiên làm việc hết hạn hoặc link không hợp lệ' });
    }

    // BƯỚC QUAN TRỌNG: Thiết lập session trước khi update
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });

    if (sessionError) {
      console.error('❌ SetSession Error:', sessionError.message);
      return res.status(400).json({ error: 'Không thể thiết lập phiên làm việc: ' + sessionError.message });
    }

    // Sau khi có session, tiến hành update mật khẩu
    const { error: updateError } = await supabaseAuth.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.error('❌ UpdateUser Error:', updateError.message);
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: 'Cập nhật mật khẩu thành công!' });
  } catch (err) {
    console.error('🔥 Reset Password System Error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi đặt lại mật khẩu' });
  }
});

// ─────────────────────────────────────────
// [POST] /api/auth/change-password - Doi mat khau khi nguoi dung da dang nhap
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Cần nhập mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi đổi mật khẩu' });
  }
});

// Activity Log Helper
// ─────────────────────────────────────────
const logActivity = async (userId, accountId, action, details = {}) => {
  try {
    await supabase.from('activity_logs').insert([{ user_id: userId, account_id: accountId, action, details }]);
  } catch (e) { console.error('Log activity error:', e); }
};

// ─────────────────────────────────────────
// CRUD Routes — stored_accounts (cần đăng nhập)
// ─────────────────────────────────────────

// Helper dọn dẹp thùng rác > 30 ngày
const cleanupTrash = async (userId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await supabase
      .from('stored_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('is_deleted', true)
      .lt('deleted_at', thirtyDaysAgo.toISOString());
  } catch (e) { console.error('Cleanup trash error:', e); }
};

const maskAccount = (account) => ({
  ...account,
  password: null,
  has_password: Boolean(account?.password),
});

const verifyUserPassword = async (email, password) => {
  if (!email || !password) return false;
  const { error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  return !error;
};

// Read All — chỉ trả về accounts chưa xóa của user hiện tại
app.get('/api/accounts', authMiddleware, async (req, res) => {
  cleanupTrash(req.user.id);

  const { search, tag, type } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 500);

  let query = supabase
    .from('stored_accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('account_type', type);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const trimmedSearch = (search || '').trim();
  if (trimmedSearch) {
    if (trimmedSearch.startsWith('#')) {
      const searchTag = trimmedSearch.slice(1).trim();
      if (searchTag) query = query.contains('tags', [searchTag]);
    } else {
      const escapedSearch = trimmedSearch.replace(/[%_,]/g, '\\$&');
      query = query.or(`account.ilike.%${escapedSearch}%,account_type.ilike.%${escapedSearch}%,information.ilike.%${escapedSearch}%,gmail_link.ilike.%${escapedSearch}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Loi khi tai du lieu' });
  }

  res.json(data.map(maskAccount));
});

app.post('/api/accounts/:id/reveal', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { currentPassword } = req.body;

    const isVerified = await verifyUserPassword(req.user.email, currentPassword);
    if (!isVerified) return res.status(401).json({ error: 'Mat khau khong dung' });

    const { data, error } = await supabase
      .from('stored_accounts')
      .select('id,password')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Khong tim thay tai khoan' });

    res.json({ id: data.id, password: decrypt(data.password) });
  } catch (err) {
    console.error('Reveal password error:', err);
    res.status(500).json({ error: 'Loi server' });
  }
});

// Create
app.post('/api/accounts', authMiddleware, async (req, res) => {
  try {
    const validated = accountSchema.parse(req.body);
    const { account_type, account, password, information, gmail_link, tags } = validated;

    const strength_score = calculateStrength(password);

    const { data, error } = await supabase
      .from('stored_accounts')
      .insert([{ 
        account_type, 
        account, 
        password: encrypt(password),
        information, 
        gmail_link, 
        tags: tags || [],
        strength_score,
        user_id: req.user.id 
      }])
      .select()
      .single();

    if (error) {
      console.error('Create account error:', error);
      return res.status(500).json({ error: getAccountWriteErrorMessage(error, 'tao tai khoan') });
    }
    logActivity(req.user.id, data.id, 'create', { account_name: account });
    
    // Trả về dữ liệu đã giải mã để frontend cập nhật UI ngay
    res.status(201).json(maskAccount(data));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: getZodMessage(err) });
    console.error('Create account server error:', err);
    res.status(500).json({ error: 'Loi server khi tao tai khoan' });
  }
});

// Bulk Import
app.post('/api/accounts/bulk', authMiddleware, async (req, res) => {
  const { accounts } = req.body;
  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
  const rows = accounts.map(a => ({
    account_type: a.account_type || 'Khác',
    account: a.account || '',
    password: encrypt(a.password || ''), // Mã hóa
    information: a.information || '',
    gmail_link: a.gmail_link || '',
    tags: Array.isArray(a.tags) ? a.tags : [],
    strength_score: calculateStrength(a.password || ''),
    user_id: req.user.id
  }));

  const { data, error } = await supabase.from('stored_accounts').insert(rows).select();
  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi nhập dữ liệu' }); }
  logActivity(req.user.id, null, 'create', { bulk: true, count: rows.length });
  res.status(201).json({ imported: data.length });
});

// Update
app.put('/api/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validated = accountUpdateSchema.parse(req.body);
    const { account_type, account, password, information, gmail_link, tags } = validated;

    // 1. Lấy dữ liệu CŨ trước khi cập nhật để so sánh
    const { data: oldData } = await supabase
      .from('stored_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!oldData) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    // Giải mã pass cũ để so sánh
    const updatePayload = {
      account_type,
      account,
      information,
      gmail_link,
      tags: tags || [],
    };

    if (password) {
      updatePayload.password = encrypt(password);
      updatePayload.strength_score = calculateStrength(password);
    }

    // 2. Thực hiện cập nhật dữ liệu mới
    const { data: newData, error } = await supabase
      .from('stored_accounts')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update account error:', error);
      return res.status(500).json({ error: getAccountWriteErrorMessage(error, 'cap nhat tai khoan') });
    }

    // 3. So sánh các trường để tìm thay đổi
    const changes = {};
    const fields = ['account_type', 'account', 'information', 'gmail_link'];
    
    fields.forEach(field => {
      const oldVal = oldData[field] || '';
      const newVal = req.body[field] || '';
      
      if (oldVal !== newVal) {
        changes[field] = {
          old: oldVal,
          new: newVal
        };
      }
    });

    if (password) {
      changes.password = { changed: true };
    }

    const oldTags = oldData.tags || [];
    const newTags = tags || [];
    if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
      changes.tags = {
        old: oldTags,
        new: newTags
      };
    }

    // 4. Lưu log chi tiết nếu có thay đổi
    logActivity(req.user.id, id, 'update', { 
      account_name: account,
      changes: Object.keys(changes).length > 0 ? changes : null
    });

    res.json(maskAccount(newData));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: getZodMessage(err) });
    console.error('Update account server error:', err);
    res.status(500).json({ error: 'Loi server khi cap nhat tai khoan' });
  }
});

// Pin Toggle
app.patch('/api/accounts/:id/pin', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { is_pinned } = req.body;

  const { data, error } = await supabase
    .from('stored_accounts')
    .update({ is_pinned })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi pin' }); }
  res.json(data);
});

// Soft Delete (chuyển vào thùng rác)
app.delete('/api/accounts/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  // Lấy tên trước khi xóa
  const { data: acc } = await supabase.from('stored_accounts').select('account').eq('id', id).eq('user_id', req.user.id).single();

  const { error } = await supabase
    .from('stored_accounts')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi xóa' }); }
  logActivity(req.user.id, id, 'delete', { account_name: acc?.account });
  res.json({ message: 'Đã chuyển vào thùng rác' });
});

// ─── Trash Routes ───

// Xem thùng rác
app.get('/api/accounts/trash', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('stored_accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi' }); }
  
  // Giải mã
  res.json(data.map(maskAccount));
});

// Khôi phục
app.post('/api/accounts/:id/restore', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  const { data, error } = await supabase
    .from('stored_accounts')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khôi phục' }); }
  logActivity(req.user.id, id, 'restore', { account_name: data?.account });
  res.json(maskAccount(data));
});

// Xóa vĩnh viễn
app.delete('/api/accounts/:id/permanent', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  const { error } = await supabase
    .from('stored_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi xóa vĩnh viễn' }); }
  res.json({ message: 'Đã xóa vĩnh viễn' });
});

// ─── Activity Log ───
app.get('/api/activity-logs', authMiddleware, async (req, res) => {
  const { action, search } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (action && action !== 'all') {
    query = query.eq('action', action);
  }

  if (search) {
    query = query.ilike('details->>account_name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi tải lịch sử' }); }
  res.json(data);
});

// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend đang chạy ở port: ${PORT}`);
});
