import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TrashModal({ 
  token,
  inline = false,
  onClose,
  onRestore: onParentRestore
}) {
  const [trashed, setTrashed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/accounts/trash`, { headers: { Authorization: `Bearer ${token}` } });
      setTrashed(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  const handleRestore = async (id) => {
    try {
      await axios.post(`${API_URL}/api/accounts/${id}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchTrash();
      if (onParentRestore) onParentRestore();
    } catch (e) { alert('Lỗi khôi phục'); }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Xóa vĩnh viễn tài khoản này? Hành động không thể hoàn tác.')) return;
    try {
      await axios.delete(`${API_URL}/api/accounts/${id}/permanent`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTrash();
    } catch (e) { alert('Lỗi xóa vĩnh viễn'); }
  };

  const timeAgo = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'Vừa xong'; if (s < 3600) return `${Math.floor(s/60)} phút trước`; if (s < 86400) return `${Math.floor(s/3600)} giờ trước`; return `${Math.floor(s/86400)} ngày trước`; };

  const content = (
    <div className={inline ? '' : 'max-h-[70vh] overflow-y-auto'}>
      {!inline && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-red-500">
            <Trash2 size={24} />
            <h2 className="text-xl font-bold">Thùng rác</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"><X size={20}/></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-notion-blue" /></div>
      ) : trashed.length === 0 ? (
        <div className="text-center py-20">
          <Trash2 size={48} className="mx-auto mb-4 text-warm-gray-100" strokeWidth={1} />
          <p className="text-warm-gray-400">Thùng rác trống.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl mb-4 text-xs font-medium">
            <AlertCircle size={14} />
            Các mục trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày.
          </div>
          {trashed.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow">
              <div className="min-w-0">
                <p className="font-bold text-notion-black dark:text-white truncate">{acc.account}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-400 uppercase font-bold">{acc.account_type}</span>
                  <span className="text-[11px] text-warm-gray-300">Xóa {timeAgo(acc.deleted_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRestore(acc.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition" title="Khôi phục">
                  <RefreshCw size={18} />
                </button>
                <button onClick={() => handlePermanentDelete(acc.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition" title="Xóa vĩnh viễn">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {content}
      </motion.div>
    </motion.div>
  );
}
