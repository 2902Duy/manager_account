import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Dark mode sync
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp');

    setLoading(true);
    
    // Lưu ý: Supabase tự động xử lý access_token từ URL hash khi người dùng nhấn link từ email
    // Ở đây ta có thể dùng client-side Supabase hoặc gọi API backend nếu backend có xử lý token.
    // Tuy nhiên, cách đơn giản nhất là dùng trực tiếp Supabase Auth ở Frontend để update mật khẩu.
    
    // Vì project đang dùng axios gọi backend, tôi sẽ hướng dẫn gọi một API backend mới (nếu bạn muốn)
    // Hoặc dùng trực tiếp logic Supabase. Ở đây tôi giả định bạn muốn xử lý qua API backend để đồng bộ.
    
    try {
      // Chúng ta sẽ gửi mật khẩu mới lên backend. 
      // Nhưng quan trọng là phải gửi kèm theo "access_token" mà Supabase đính trên URL hash.
      const hash = window.location.hash;
      if (!hash) {
        throw new Error('Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại email.');
      }

      // Backend cần nhận mật khẩu mới này
      // Lưu ý: Cách chuẩn nhất của Supabase là thực hiện updateUser ở frontend.
      // Tôi sẽ sử dụng logic: Người dùng click link -> Supabase xác thực -> hash chứa token.
      // Chúng ta sẽ báo cho người dùng biết và hướng dẫn họ.
      
      // TẠM THỜI: Ta sẽ dùng logic trực tiếp với Supabase Auth ở đây nếu có client.
      // Nếu không, ta gửi mật khẩu lên một endpoint backend.
      
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        password,
        hash: window.location.hash
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-white dark:bg-[#191919] flex flex-col justify-center items-center py-12 px-4 transition-colors">
      <div className="max-w-[400px] w-full">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Account Vault" className="w-14 h-14 mb-4 object-contain" />
          <h1 className="text-[26px] font-bold tracking-[-0.6px] text-notion-black dark:text-white">Đặt lại mật khẩu</h1>
          <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400 mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <div className="bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-700 rounded-[12px] shadow-deep p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[18px] font-bold text-notion-black dark:text-white mb-2">Thành công!</p>
              <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400">Mật khẩu đã được cập nhật. Đang quay lại trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="text-[13px] text-red-600 px-3 py-2 rounded-[6px] bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[6px]">Mật khẩu mới</label>
                <input
                  type="password" required autoFocus
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[9px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[6px]">Xác nhận mật khẩu</label>
                <input
                  type="password" required
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[9px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-notion-blue/40 focus:border-notion-blue transition"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-60 text-white py-[10px] rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98]"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[13px] text-warm-gray-500 dark:text-neutral-400 mt-5">
          <Link to="/login" className="text-notion-blue font-medium hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
