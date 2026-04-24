import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (form.password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự');
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, {
        email: form.email,
        password: form.password,
      });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Yếu', color: 'bg-red-400', w: 'w-1/4' };
    if (p.length < 10) return { label: 'Trung bình', color: 'bg-yellow-400', w: 'w-2/4' };
    if (!/[A-Z]/.test(p) || !/\d/.test(p)) return { label: 'Khá', color: 'bg-blue-400', w: 'w-3/4' };
    return { label: 'Mạnh', color: 'bg-green-500', w: 'w-full' };
  })();

  return (
    <div className="min-h-screen bg-notion-white flex flex-col justify-center items-center py-12 px-4">
      <div className="max-w-[400px] w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 100 100" className="w-10 h-10 mb-4 text-warm-dark" fill="currentColor">
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" />
          </svg>
          <h1 className="text-[26px] font-bold tracking-[-0.6px] text-notion-black">Tạo tài khoản</h1>
          <p className="text-[14px] text-warm-gray-500 mt-1">Miễn phí · Không giới hạn</p>
        </div>

        {/* Card */}
        <div className="bg-notion-white border border-whisper rounded-[12px] shadow-deep p-8">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <p className="text-[15px] font-semibold text-notion-black mb-2">Kiểm tra email!</p>
              <p className="text-[13px] text-warm-gray-500">{success}</p>
              <p className="text-[12px] text-warm-gray-300 mt-3">Đang chuyển đến trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="text-[13px] text-red-600 px-3 py-2 rounded-[6px] bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[6px]">Email</label>
                <input
                  type="email" required autoFocus
                  placeholder="you@example.com"
                  className="w-full border border-whisper rounded-[6px] px-3 py-[9px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition bg-notion-white"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[6px]">Mật khẩu</label>
                <input
                  type="password" required
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full border border-whisper rounded-[6px] px-3 py-[9px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition bg-notion-white"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                />
                {/* Thanh độ mạnh mật khẩu */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 bg-warm-white rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                    </div>
                    <p className="text-[11px] text-warm-gray-300 mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[6px]">Xác nhận mật khẩu</label>
                <input
                  type="password" required
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full border rounded-[6px] px-3 py-[9px] text-[15px] focus:outline-none focus:ring-2 transition bg-notion-white
                    ${form.confirm && form.confirm !== form.password
                      ? 'border-red-300 focus:ring-red-300/40'
                      : 'border-whisper focus:ring-notion-blue/40 focus:border-notion-blue'
                    }`}
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                />
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-[11px] text-red-500 mt-1">Mật khẩu không khớp</p>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-60 text-white py-[10px] rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98] mt-1"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[13px] text-warm-gray-500 mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-notion-blue font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
