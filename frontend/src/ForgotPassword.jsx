import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-white flex flex-col justify-center items-center py-12 px-4">
      <div className="max-w-[400px] w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 100 100" className="w-10 h-10 mb-4 text-warm-dark" fill="currentColor">
            <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" />
          </svg>
          <h1 className="text-[26px] font-bold tracking-[-0.6px] text-notion-black">Quên mật khẩu</h1>
          <p className="text-[14px] text-warm-gray-500 mt-1 text-center">
            Nhập email để nhận link đặt lại mật khẩu
          </p>
        </div>

        {/* Card */}
        <div className="bg-notion-white border border-whisper rounded-[12px] shadow-deep p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <p className="text-[16px] font-semibold text-notion-black mb-2">Email đã được gửi!</p>
              <p className="text-[13px] text-warm-gray-500 leading-relaxed">
                Kiểm tra hòm thư của <span className="font-medium text-notion-black">{email}</span> và nhấn vào link để đặt lại mật khẩu.
              </p>
              <p className="text-[12px] text-warm-gray-300 mt-3">
                Không thấy mail? Kiểm tra thư mục Spam.
              </p>
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
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-60 text-white py-[10px] rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98]"
              >
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[13px] text-warm-gray-500 mt-5">
          <Link to="/login" className="text-notion-blue font-medium hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
