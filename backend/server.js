// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

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
// Middleware
// ─────────────────────────────────────────

// Hỗ trợ nhiều origin cách nhau bởi dấu phẩy, tự thêm https:// nếu thiếu
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN || '').split(',').map(o => {
    o = o.trim().replace(/\/+$/, '');
    if (o && !o.startsWith('http')) o = 'https://' + o;
    return o;
  }),
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    // Không có origin (server-to-server, Postman) → cho phép
    if (!origin) return cb(null, true);
    // Kiểm tra danh sách cho phép
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Tự động cho phép mọi *.vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    console.log('❌ CORS blocked origin:', origin);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

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
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Cần nhập email' });

  const redirectTo = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password`;
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hòm thư!' });
});

// [POST] /api/auth/reset-password — Đặt lại mật khẩu mới
app.post('/api/auth/reset-password', async (req, res) => {
  const { password, hash } = req.body;
  if (!password) return res.status(400).json({ error: 'Cần nhập mật khẩu mới' });

  // Supabase cần token từ hash để xác thực việc đổi pass
  // Token thường nằm sau #access_token=...
  const tokenMatch = hash?.match(/access_token=([^&]*)/);
  const accessToken = tokenMatch ? tokenMatch[1] : null;

  if (!accessToken) {
    return res.status(400).json({ error: 'Phiên làm việc hết hạn hoặc link không hợp lệ' });
  }

  // Sử dụng token này để update user
  const { error } = await supabaseAuth.auth.updateUser({
    password: password
  }, {
    accessToken: accessToken
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: 'Cập nhật mật khẩu thành công!' });
});

// ─────────────────────────────────────────
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

// Read All — chỉ trả về accounts chưa xóa của user hiện tại
app.get('/api/accounts', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('stored_accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('id', { ascending: false })
    .limit(500);

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi tải dữ liệu' }); }
  res.json(data);
});

// Create
app.post('/api/accounts', authMiddleware, async (req, res) => {
  const { account_type, account, password, information, gmail_link } = req.body;

  const { data, error } = await supabase
    .from('stored_accounts')
    .insert([{ account_type, account, password, information, gmail_link, user_id: req.user.id }])
    .select()
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi tạo tài khoản' }); }
  logActivity(req.user.id, data.id, 'create', { account_name: account });
  res.status(201).json(data);
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
    password: a.password || '',
    information: a.information || '',
    gmail_link: a.gmail_link || '',
    user_id: req.user.id
  }));

  const { data, error } = await supabase.from('stored_accounts').insert(rows).select();
  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi nhập dữ liệu' }); }
  logActivity(req.user.id, null, 'create', { bulk: true, count: rows.length });
  res.status(201).json({ imported: data.length });
});

// Update
app.put('/api/accounts/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { account_type, account, password, information, gmail_link } = req.body;

  // 1. Lấy dữ liệu CŨ trước khi cập nhật để so sánh
  const { data: oldData } = await supabase
    .from('stored_accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (!oldData) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

  // 2. Thực hiện cập nhật dữ liệu mới
  const { data: newData, error } = await supabase
    .from('stored_accounts')
    .update({ account_type, account, password, information, gmail_link })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi cập nhật' }); }

  // 3. So sánh các trường để tìm thay đổi
  const changes = {};
  const fields = ['account_type', 'account', 'password', 'information', 'gmail_link'];
  
  fields.forEach(field => {
    // Chỉ lưu thay đổi nếu giá trị khác nhau (loại bỏ trường hợp null vs undefined vs '')
    const oldVal = oldData[field] || '';
    const newVal = req.body[field] || '';
    
    if (oldVal !== newVal) {
      changes[field] = {
        old: oldVal,
        new: newVal
      };
    }
  });

  // 4. Lưu log chi tiết nếu có thay đổi
  logActivity(req.user.id, id, 'update', { 
    account_name: account,
    changes: Object.keys(changes).length > 0 ? changes : null
  });

  res.json(newData);
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
  res.json(data);
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
  res.json(data);
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
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi tải lịch sử' }); }
  res.json(data);
});

// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend đang chạy ở port: ${PORT}`);
});
