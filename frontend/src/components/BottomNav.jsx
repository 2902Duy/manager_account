import React from 'react';
import { Shield, Trash2, History, Settings, Images } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'vault', label: 'Kho', icon: Shield },
    { id: 'images', label: 'Ảnh', icon: Images },
    { id: 'activity', label: 'Lịch sử', icon: History },
    { id: 'trash', label: 'Rác', icon: Trash2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-whisper bg-white px-1 dark:border-neutral-800 dark:bg-[#1f1f1f] md:hidden pb-safe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === tab.id ? 'text-notion-blue dark:text-blue-400' : 'text-warm-gray-400'
          }`}
        >
          <tab.icon size={19} className={activeTab === tab.id ? 'scale-110' : ''} />
          <span className="text-[10px] font-medium">{tab.label}</span>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 h-1 w-1 rounded-full bg-notion-blue dark:bg-blue-400" />
          )}
        </button>
      ))}
    </nav>
  );
}
