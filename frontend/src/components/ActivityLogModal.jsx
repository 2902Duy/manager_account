import React from 'react';
import { Clock, X, Plus, Trash2, RefreshCw, Pin, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActivityLogModal({ 
  logs, 
  onClose, 
  actionLabels, 
  actionColors, 
  timeAgo 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[520px] max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-notion-blue" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Lịch sử hoạt động</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <div className="flex justify-center mb-3">
              <Clock size={40} strokeWidth={1} className="text-warm-gray-200 dark:text-neutral-700" />
            </div>
            <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={log.id} 
                className="flex gap-3 py-3 border-b border-whisper dark:border-neutral-700 last:border-b-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  log.action === 'create' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 
                  log.action === 'delete' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 
                  log.action === 'restore' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                  log.action === 'pin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-500' :
                  'bg-blue-50 dark:bg-blue-500/10 text-notion-blue'
                }`}>
                  {log.action === 'create' ? <Plus size={16}/> : 
                   log.action === 'delete' ? <Trash2 size={16}/> : 
                   log.action === 'restore' ? <RefreshCw size={16}/> : 
                   log.action === 'pin' || log.action === 'unpin' ? <Pin size={16}/> : 
                   <Edit2 size={16}/>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-notion-black dark:text-neutral-200">
                    <span className={`font-semibold ${actionColors[log.action] || ''}`}>{actionLabels[log.action] || log.action}</span> 
                    {log.details?.account_name && <span className="text-warm-gray-500 dark:text-neutral-400 ml-1">— {log.details.account_name}</span>}
                  </p>
                  
                  {log.action === 'update' && log.details?.changes && (
                    <div className="mt-1.5 pl-2.5 border-l-2 border-whisper dark:border-neutral-700 space-y-1 py-0.5">
                      {Object.entries(log.details.changes).map(([field, val]) => {
                        const fieldLabels = {
                          account_type: 'Loại',
                          account: 'Tài khoản',
                          password: 'Mật khẩu',
                          information: 'Ghi chú',
                          gmail_link: 'Email liên kết'
                        };
                        return (
                          <p key={field} className="text-[11px] leading-relaxed">
                            <span className="text-warm-gray-400 dark:text-neutral-500 font-medium">{fieldLabels[field] || field}:</span>{' '}
                            <span className="text-warm-gray-400 line-through px-1 bg-warm-white dark:bg-neutral-800 rounded">{field === 'password' ? '••••' : (val.old || 'trống')}</span>
                            <span className="text-warm-gray-300 dark:text-neutral-600 px-1">→</span>
                            <span className="text-notion-blue dark:text-blue-400 font-medium px-1 bg-notion-blue/5 dark:bg-blue-500/10 rounded">{field === 'password' ? '••••' : (val.new || 'trống')}</span>
                          </p>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className="text-[11px] text-warm-gray-300 dark:text-neutral-500 mt-1">{timeAgo(log.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
