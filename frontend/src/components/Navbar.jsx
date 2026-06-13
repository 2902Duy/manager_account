import React from 'react';
import { Sun, Moon, Clock, Trash2, Package, RefreshCw, LogOut } from 'lucide-react';

export default function Navbar({ 
  dark, setDark, 
  onShowActivity, 
  onShowTrash, 
  isLocked, setIsLocked, 
  onLogout 
}) {
  return (
    <nav className="flex justify-between items-center h-[54px] px-4 sm:px-6 border-b border-whisper dark:border-neutral-800 bg-notion-white dark:bg-[#202020] sticky top-0 z-10">
      <div className="flex items-center gap-2.5 cursor-pointer">
        <img src="/logo.png" alt="DLock" className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] object-contain" />
        <span className="font-display text-[15px] sm:text-[17px] text-notion-black dark:text-neutral-100">DLock</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={onShowActivity} className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title="Lịch sử">
          <Clock size={16} />
        </button>
        <button onClick={onShowTrash} className="relative p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title="Thùng rác">
          <Trash2 size={16} />
        </button>
        <div className="h-4 w-[1px] bg-whisper dark:bg-neutral-800 mx-1"></div>
        <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-[6px] transition flex items-center gap-1.5 ${isLocked ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800'}`} title={isLocked ? 'Vault đang khóa' : 'Khóa Vault'}>
          {isLocked ? <Package size={16} /> : <RefreshCw size={16} />}
          <span className="text-[12px] font-medium hidden md:inline">{isLocked ? 'Đã khóa' : 'Đang mở'}</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-warm-gray-500 dark:text-neutral-400 hover:text-notion-black dark:hover:text-white transition px-3 py-1.5 rounded-[6px] hover:bg-warm-white dark:hover:bg-neutral-800">
          <LogOut size={15} />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
