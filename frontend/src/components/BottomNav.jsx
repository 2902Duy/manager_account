import React from 'react';
import { Shield, Trash2, History, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'vault', label: 'Kho', icon: Shield },
    { id: 'activity', label: 'Lịch sử', icon: History },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#1f1f1f] border-t border-whisper dark:border-neutral-800 flex items-center justify-around px-2 z-40 md:hidden pb-safe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${
            activeTab === tab.id ? 'text-notion-blue dark:text-blue-400' : 'text-warm-gray-400'
          }`}
        >
          <tab.icon size={20} className={activeTab === tab.id ? 'scale-110' : ''} />
          <span className="text-[10px] font-medium">{tab.label}</span>
          {activeTab === tab.id && (
            <div className="w-1 h-1 rounded-full bg-notion-blue dark:bg-blue-400 absolute bottom-2" />
          )}
        </button>
      ))}
    </nav>
  );
}
