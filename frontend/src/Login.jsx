import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      onLogin(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-white flex flex-col justify-center items-center py-12 px-4">
      <div className="max-w-[400px] w-full">

        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 100 100" className="w-10 h-10 mb-4 text-warm-dark" fill="currentColor">
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" />
          </svg>
          <h1 className="text-[26px] font-bold tracking-[-0.6px] text-notion-black">Đăng nhập</h1>
          <p className="text-[14px] text-warm-gray-500 mt-1">Tiếp tục vào Account Vault</p>
        </div>

        {/* Card */}
        <div className="bg-notion-white border border-whisper rounded-[12px] shadow-deep p-8">
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
                className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[9px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-warm-gray-500 mb-[6px]">Mật khẩu</label>
              <input
                type="password" required
                placeholder="••••••••"
                className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[9px] text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[13px] text-notion-blue hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-60 text-white py-[10px] rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98]"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-warm-gray-500 mt-5">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-notion-blue font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
