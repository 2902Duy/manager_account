import React from 'react';
import {
  Shield,
  Trash2,
  History,
  Settings,
  LogOut,
  LockKeyhole,
  UnlockKeyhole,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isLocked,
  onLogout,
  onLock,
  userEmail,
  isCollapsed,
  setIsCollapsed
}) {
  const menuItems = [
    { id: 'vault', label: 'Danh sách tài khoản', icon: Shield },
    { id: 'activity', label: 'Lịch sử hoạt động', icon: History },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const displayName = userEmail?.split('@')[0] || 'Người dùng';

  return (
    <Motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 70 : 240 }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-whisper bg-[#fbfaf8] text-notion-black shadow-[1px_0_0_rgba(0,0,0,0.02)] transition-colors duration-300 dark:border-neutral-800 dark:bg-[#171717] dark:text-white md:flex"
    >
      <div className="relative flex h-[72px] items-center px-4">
        <div className={`flex min-w-0 items-center ${isCollapsed ? 'w-full justify-center' : 'gap-3'}`}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] border border-whisper bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <img src="/logo-dlock.png" alt="DLock" className="h-7 w-7 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-[17px]">DLock</p>
              <p className="truncate text-[11px] font-medium text-warm-gray-500 dark:text-neutral-500">Secure workspace</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-whisper bg-white text-warm-gray-500 shadow-sm transition hover:border-notion-blue hover:text-notion-blue dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={`group relative flex h-11 w-full items-center rounded-[10px] text-[14px] font-semibold transition-all ${
              isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
            } ${
              activeTab === item.id
                ? 'bg-notion-blue/10 text-notion-blue dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-warm-gray-500 hover:bg-white hover:text-notion-black dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            {activeTab === item.id && (
              <Motion.span
                layoutId="sidebar-active-indicator"
                className="absolute left-0 h-6 w-1 rounded-r-full bg-notion-blue dark:bg-blue-400"
              />
            )}
            <item.icon size={19} className="flex-shrink-0 transition-transform group-hover:scale-105" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
            {activeTab === item.id && !isCollapsed && (
              <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-notion-blue dark:bg-blue-400" />
            )}
          </button>
        ))}
      </nav>

      <div className="space-y-3 border-t border-whisper p-3 dark:border-neutral-800">
        <button
          onClick={onLock}
          title={isLocked ? 'Vault đang khóa' : 'Khóa Vault'}
          className={`flex w-full items-center rounded-[10px] border transition ${
            isCollapsed ? 'h-11 justify-center px-0' : 'gap-3 px-3 py-2.5'
          } ${
            isLocked
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
          }`}
        >
          {isLocked ? <LockKeyhole size={18} /> : <UnlockKeyhole size={18} />}
          {!isCollapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-[13px] font-bold">{isLocked ? 'Vault đang khóa' : 'Vault đang mở'}</p>
              <p className="truncate text-[11px] font-medium opacity-75">{isLocked ? 'Bấm để mở khóa' : 'Bấm để khóa ngay'}</p>
            </div>
          )}
        </button>

        <div className={`flex items-center rounded-[10px] bg-white p-2 shadow-sm dark:bg-neutral-900 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] bg-notion-blue/10 text-notion-blue dark:bg-blue-500/10 dark:text-blue-400">
            <User size={18} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{displayName}</p>
              <p className="truncate text-[11px] font-medium text-warm-gray-500 dark:text-neutral-500">{userEmail}</p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          title="Đăng xuất"
          className={`group flex h-11 w-full items-center rounded-[10px] text-warm-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
        >
          <LogOut size={19} className="transition-transform group-hover:translate-x-0.5" />
          {!isCollapsed && <span className="text-[14px] font-semibold">Đăng xuất</span>}
        </button>
      </div>
    </Motion.aside>
  );
}
