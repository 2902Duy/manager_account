import React from 'react';
import { Package } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import PasswordInput from './PasswordInput';

export default function UnlockModal({
  unlockPassword,
  setUnlockPassword,
  unlockError,
  setUnlockError,
  onUnlock,
  onClose
}) {
  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-warm-dark/60 dark:bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4"
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-700 rounded-[12px] shadow-deep p-8 w-full max-w-[360px]"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4">
            <Package size={28} />
          </div>
          <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Mở khóa Vault</h2>
          <p className="text-[13px] text-warm-gray-500 dark:text-neutral-400 mt-2">Vui lòng nhập mật khẩu đăng nhập để xem thông tin nhạy cảm.</p>
        </div>
        <form onSubmit={onUnlock} className="space-y-4">
          <div>
            <PasswordInput
              autoFocus
              placeholder="Mật khẩu của bạn"
              className={`w-full bg-warm-white dark:bg-neutral-800 border ${unlockError ? 'border-red-500' : 'border-whisper dark:border-neutral-700'} rounded-[8px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 transition`}
              value={unlockPassword}
              onChange={e => { setUnlockPassword(e.target.value); setUnlockError(''); }}
            />
            {unlockError && <p className="text-[12px] text-red-500 mt-1.5 ml-1">{unlockError}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[14px] font-medium text-warm-gray-500 hover:bg-warm-white dark:hover:bg-neutral-800 rounded-[8px] transition">Hủy</button>
            <button type="submit" className="flex-[2] bg-notion-blue hover:bg-notion-blue-hover text-white px-4 py-2.5 rounded-[8px] text-[14px] font-semibold transition active:scale-[0.98]">Xác nhận</button>
          </div>
        </form>
      </Motion.div>
    </Motion.div>
  );
}
