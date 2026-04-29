import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, X, Plus, Trash2, RefreshCw, Pin, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ActivityLogModal({ 
  token,
  inline = false,
  onClose, 
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const actionLabels = { create: 'Tạo mới', update: 'Cập nhật', delete: 'Xóa', restore: 'Khôi phục', pin: 'Ghim', unpin: 'Bỏ ghim' };
  const actionColors = { create: 'text-emerald-500', update: 'text-notion-blue', delete: 'text-red-400', restore: 'text-amber-500', pin: 'text-purple-500', unpin: 'text-warm-gray-300' };
  const timeAgo = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'Vừa xong'; if (s < 3600) return `${Math.floor(s/60)} phút trước`; if (s < 86400) return `${Math.floor(s/3600)} giờ trước`; return `${Math.floor(s/86400)} ngày trước`; };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/activity-logs`, { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const content = (
    <div className={`${inline ? '' : 'max-h-[80vh] overflow-y-auto'}`}>
      {!inline && (
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-notion-blue" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Lịch sử hoạt động</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-notion-blue" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10">
          <Clock size={48} className="mx-auto mb-4 text-warm-gray-100" strokeWidth={1} />
          <p className="text-warm-gray-400">Chưa có hoạt động nào được ghi lại.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={log.id} className="flex gap-4 py-4 border-b border-whisper dark:border-neutral-800 last:border-0 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                log.action === 'create' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 
                log.action === 'delete' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 
                log.action === 'restore' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                'bg-blue-50 dark:bg-blue-500/10 text-notion-blue'
              }`}>
                {log.action === 'create' ? <Plus size={18}/> : 
                 log.action === 'delete' ? <Trash2 size={18}/> : 
                 log.action === 'restore' ? <RefreshCw size={18}/> : 
                 <Edit2 size={18}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[14px] font-bold ${actionColors[log.action]}`}>{actionLabels[log.action]}</span>
                  <span className="text-[11px] text-warm-gray-300">{timeAgo(log.created_at)}</span>
                </div>
                <p className="text-[13px] text-notion-black dark:text-neutral-300">
                  {log.details?.account_name ? <span>Thao tác trên <strong>{log.details.account_name}</strong></span> : 'Thực hiện thay đổi hệ thống'}
                </p>
                {log.action === 'update' && log.details?.changes && (
                  <div className="mt-2 grid grid-cols-1 gap-1">
                    {Object.entries(log.details.changes).map(([field, val]) => (
                      <div key={field} className="text-[11px] flex items-center gap-2 text-warm-gray-400">
                        <span className="capitalize">{field}:</span>
                        <span className="line-through opacity-50">{field === 'password' ? '••••' : val.old}</span>
                        <RefreshCw size={10} />
                        <span className="text-notion-blue dark:text-blue-400 font-medium">{field === 'password' ? '••••' : val.new}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg"
      >
        {content}
      </motion.div>
    </motion.div>
  );
}
