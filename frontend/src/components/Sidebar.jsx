import React from 'react';
import {
  Shield,
  Trash2,
  History,
  Settings,
  LogOut,
  Moon,
  Sun,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({
  activeTab,
  setActiveTab,
  dark,
  setDark,
  isLocked,
  onLogout,
  onLock,
  userEmail,
  isCollapsed,
  setIsCollapsed
}) {
  const menuItems = [
    { id: 'vault', label: 'Danh sách tài khoản', icon: Shield },
    { id: 'activity', label: 'Lịch sử', icon: History },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 70 : 240 }}
      className="fixed left-0 top-0 h-screen bg-warm-white dark:bg-[#1f1f1f] border-r border-whisper dark:border-neutral-800 z-40 flex flex-col transition-colors duration-300"
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-5 mb-4 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-notion-blue rounded-[8px] flex items-center justify-center flex-shrink-0 shadow-lg shadow-notion-blue/20">
            <Shield className="text-white" size={18} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-[16px] tracking-tight text-notion-black dark:text-white whitespace-nowrap">Account Vault</span>
          )}
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-full flex items-center justify-center text-warm-gray-400 hover:text-notion-blue transition shadow-sm z-50 hidden md:flex"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all group relative ${activeTab === item.id
                ? 'bg-notion-blue/10 dark:bg-blue-500/10 text-notion-blue dark:text-blue-400'
                : 'text-warm-gray-500 dark:text-neutral-400 hover:bg-whisper dark:hover:bg-neutral-800'
              }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
            {!isCollapsed && <span className="text-[14px] font-medium">{item.label}</span>}

            {activeTab === item.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-notion-blue rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-whisper dark:border-neutral-800 space-y-1">
        {/* User & Logout */}
        <div className="pt-2">
          <div className={`flex items-center gap-3 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-notion-blue/10 flex items-center justify-center text-notion-blue">
              <User size={18} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-notion-black dark:text-white truncate">{userEmail?.split('@')[0]}</p>
                <p className="text-[10px] text-warm-gray-400 truncate">{userEmail}</p>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-[8px] text-warm-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-[14px] font-medium">Đăng xuất</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
