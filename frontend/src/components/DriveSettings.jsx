import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cloud, ExternalLink, Loader2, Unplug } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
});

export default function DriveSettings() {
  const [status, setStatus] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('token');
  const isLocalDev = import.meta.env.DEV && token === 'local-dev-token';

  const fetchStatus = async () => {
    if (!token || isLocalDev) {
      setStatus({ connected: false });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/drive/status`, { headers: getAuthHeaders() });
      setStatus(res.data || { connected: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Không kiểm tra được Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectDrive = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/drive/auth-url`, { headers: getAuthHeaders() });
      window.location.href = res.data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Không tạo được liên kết Google Drive.');
      setActionLoading(false);
    }
  };

  const disconnectDrive = async () => {
    if (!confirm('Ngắt kết nối Google Drive? Ảnh đã upload sẽ không bị xóa khỏi Drive.')) return;

    setActionLoading(true);
    setError('');
    try {
      await axios.delete(`${API_URL}/api/drive/disconnect`, { headers: getAuthHeaders() });
      setStatus({ connected: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Không ngắt được Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
      <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
        <Cloud size={18} className="text-notion-blue" /> Google Drive
      </h3>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[14px]">
            {status.connected ? 'Đã kết nối Drive' : 'Chưa kết nối Drive'}
          </p>
          <p className="text-[13px] text-warm-gray-400">
            {status.connected
              ? `Ảnh sẽ lưu trong thư mục DLock / Account Images${status.google_email ? ` (${status.google_email})` : ''}.`
              : 'Kết nối Google Drive để lưu ảnh tài khoản vào Drive riêng của bạn.'}
          </p>
          {isLocalDev && (
            <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-2">
              Chức năng Drive cần tài khoản đăng nhập thật, không dùng local test token.
            </p>
          )}
          {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
        </div>

        <div className="flex gap-2">
          {loading ? (
            <button disabled className="px-4 py-2 rounded-lg border border-whisper dark:border-neutral-700 text-[13px] font-bold text-warm-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Đang kiểm tra
            </button>
          ) : status.connected ? (
            <button
              type="button"
              onClick={disconnectDrive}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-500 text-[13px] font-bold transition disabled:opacity-60 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />}
              Ngắt kết nối
            </button>
          ) : (
            <button
              type="button"
              onClick={connectDrive}
              disabled={actionLoading || isLocalDev}
              className="px-4 py-2 rounded-lg bg-notion-blue hover:bg-notion-blue-hover text-white text-[13px] font-bold transition disabled:opacity-60 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Kết nối Drive
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
