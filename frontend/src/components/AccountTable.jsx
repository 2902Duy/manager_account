import React from 'react';
import { Pin, Eye, EyeOff, Check, Copy, PinOff, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountTable({ 
  accounts, 
  showPwd, 
  onTogglePwd, 
  onCopy, 
  copied, 
  onPin, 
  onEdit, 
  onDelete,
  isPinnedTable = false
}) {
  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden sm:block bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-800 rounded-[10px] shadow-whisper overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[650px] text-left text-[14px] border-collapse table-fixed">
            <thead className="bg-[#fafaf9] dark:bg-[#2a2a2a] text-warm-gray-500 dark:text-neutral-400 text-[12px] uppercase tracking-[0.5px]">
              <tr>
                <th className="px-4 py-2.5 font-semibold border-b border-whisper dark:border-neutral-700 w-[25%]">Tài khoản</th>
                <th className="px-4 py-2.5 font-semibold border-b border-whisper dark:border-neutral-700 w-[22%]">Mật khẩu</th>
                <th className="px-4 py-2.5 font-semibold border-b border-whisper dark:border-neutral-700 w-[22%]">Ghi chú</th>
                <th className="px-4 py-2.5 font-semibold border-b border-whisper dark:border-neutral-700 w-[22%]">Gmail liên kết</th>
                <th className="px-4 py-2.5 font-semibold border-b border-whisper dark:border-neutral-700 w-[9%] text-right"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {accounts.map((acc) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    key={acc.id} 
                    className="hover:bg-warm-white/60 dark:hover:bg-neutral-800/60 transition group align-top border-b border-whisper dark:border-neutral-800 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium text-[14px] text-notion-black dark:text-neutral-100 truncate" title={acc.account}>
                      <div className="truncate">{acc.account}</div>
                      <div className="flex flex-wrap gap-1 mt-1 opacity-70">
                        {(acc.tags || []).map(tag => (
                          <span key={tag} className="text-[10px] px-1 bg-notion-blue/5 text-notion-blue dark:text-blue-400 dark:bg-blue-500/10 rounded">#{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="font-mono text-[13px] text-warm-gray-500 dark:text-neutral-400 bg-warm-white dark:bg-neutral-800 px-1.5 py-[2px] rounded-[4px] truncate">{showPwd[acc.id] ? acc.password : '••••••••'}</span>
                          <div className="flex flex-shrink-0">
                            <button onClick={() => onTogglePwd(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-warm-gray-500 dark:hover:text-neutral-300 transition p-1 rounded-[4px]">{showPwd[acc.id] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                            <button onClick={() => onCopy(acc.password, acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-notion-blue transition p-1 rounded-[4px]">{copied === acc.id ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>}</button>
                          </div>
                        </div>
                        {/* Strength Indicator */}
                        <div className="w-full h-[2px] bg-warm-white dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              acc.strength_score >= 80 ? 'bg-emerald-500' : 
                              acc.strength_score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${acc.strength_score || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.information || '—'}</td>
                    <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.gmail_link || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => onPin(acc.id, isPinnedTable)} className={`${isPinnedTable ? 'text-amber-400' : 'text-warm-gray-300 dark:text-neutral-500'} hover:bg-amber-50 dark:hover:bg-amber-500/10 transition p-1.5 rounded-[6px]`} title={isPinnedTable ? "Bỏ ghim" : "Ghim"}>
                          {isPinnedTable ? <PinOff size={15}/> : <Pin size={15}/>}
                        </button>
                        <button onClick={() => onEdit(acc)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-notion-blue/10 hover:text-notion-blue transition p-1.5 rounded-[6px]" title="Sửa"><Edit2 size={15}/></button>
                        <button onClick={() => onDelete(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition p-1.5 rounded-[6px]" title="Xóa"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        <AnimatePresence initial={false}>
          {accounts.map((acc) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={acc.id}
              className="bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-800 rounded-[12px] p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-notion-black dark:text-white truncate">{acc.account}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[11px] font-medium text-warm-gray-400 bg-warm-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-whisper dark:border-neutral-700">
                      {acc.account_type}
                    </span>
                    {(acc.tags || []).map(tag => (
                      <span key={tag} className="text-[11px] font-medium text-notion-blue bg-notion-blue/5 dark:text-blue-400 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onPin(acc.id, isPinnedTable)} className={`p-2 rounded-full ${isPinnedTable ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-warm-gray-300'}`}>
                    {isPinnedTable ? <PinOff size={16}/> : <Pin size={16}/>}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between bg-warm-white dark:bg-neutral-800/50 rounded-[8px] px-3 py-2">
                  <span className="font-mono text-[14px] text-notion-black dark:text-neutral-100 truncate mr-2">
                    {showPwd[acc.id] ? acc.password : '••••••••••••'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => onTogglePwd(acc.id)} className="p-1.5 text-warm-gray-400 hover:text-notion-black transition">
                      {showPwd[acc.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                    <button onClick={() => onCopy(acc.password, acc.id)} className="p-1.5 text-warm-gray-400 hover:text-notion-blue transition">
                      {copied === acc.id ? <Check size={16} className="text-green-500" /> : <Copy size={16}/>}
                    </button>
                  </div>
                </div>
                
                {acc.information && (
                  <div className="text-[13px] text-warm-gray-500 dark:text-neutral-400 px-1 italic">
                    {acc.information}
                  </div>
                )}
                
                {acc.gmail_link && (
                  <div className="flex items-center gap-1.5 text-[12px] text-warm-gray-400 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-notion-blue/40"></span>
                    <span className="truncate">{acc.gmail_link}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-whisper dark:border-neutral-800 pt-3">
                <button onClick={() => onEdit(acc)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-warm-gray-500 dark:text-neutral-300 bg-warm-white dark:bg-neutral-800 rounded-[6px]">
                  <Edit2 size={14}/> Sửa
                </button>
                <button onClick={() => onDelete(acc.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-red-500 bg-red-50 dark:bg-red-500/10 rounded-[6px]">
                  <Trash2 size={14}/> Xóa
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
