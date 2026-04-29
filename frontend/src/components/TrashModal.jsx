import React from 'react';
import { Trash, X, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrashModal({ 
  accounts, 
  onClose, 
  onRestore, 
  onPermanentDelete, 
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
            <Trash size={20} className="text-red-500" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Thùng rác</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
        </div>
        {accounts.length === 0 ? (
          <div className="text-center py-10">
            <div className="flex justify-center mb-3">
              <Trash size={40} strokeWidth={1} className="text-warm-gray-200 dark:text-neutral-700" />
            </div>
            <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400">Thùng rác trống</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={acc.id} 
                className="flex items-center justify-between p-3 bg-warm-white dark:bg-neutral-800 rounded-[8px] border border-whisper dark:border-neutral-700"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-notion-black dark:text-neutral-100 truncate">{acc.account}</p>
                  <p className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{acc.account_type} • Đã xóa {acc.deleted_at ? timeAgo(acc.deleted_at) : ''}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button onClick={() => onRestore(acc.id)} className="text-[12px] font-medium text-notion-blue hover:bg-notion-blue/10 px-2.5 py-1.5 rounded-[6px] transition flex items-center gap-1"><RotateCcw size={13}/>Khôi phục</button>
                  <button onClick={() => onPermanentDelete(acc.id)} className="text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2.5 py-1.5 rounded-[6px] transition">Xóa hẳn</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
