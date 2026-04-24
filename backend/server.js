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

// Hỗ trợ nhiều origin cách nhau bởi dấu phẩy, và tự xóa dấu / cuối
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN || '').split(',').map(o => o.trim().replace(/\/+$/, '')),
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
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

// ─────────────────────────────────────────
// CRUD Routes — stored_accounts (cần đăng nhập)
// ─────────────────────────────────────────

// Read All — chỉ trả về accounts của user hiện tại
app.get('/api/accounts', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('stored_accounts')
    .select('*')
    .eq('user_id', req.user.id)
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
  res.status(201).json(data);
});

// Update
app.put('/api/accounts/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { account_type, account, password, information, gmail_link } = req.body;

  const { data, error } = await supabase
    .from('stored_accounts')
    .update({ account_type, account, password, information, gmail_link })
    .eq('id', id)
    .eq('user_id', req.user.id) // bảo vệ: chỉ update record của chính mình
    .select()
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi cập nhật' }); }
  if (!data) return res.status(404).json({ message: 'Không tìm thấy' });
  res.json(data);
});

// Delete
app.delete('/api/accounts/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  const { error } = await supabase
    .from('stored_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id); // bảo vệ: chỉ xóa record của chính mình

  if (error) { console.error(error); return res.status(500).json({ error: 'Lỗi khi xóa' }); }
  res.json({ message: 'Đã xóa' });
});

// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend đang chạy ở port: ${PORT}`);
});
