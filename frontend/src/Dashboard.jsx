import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Pin, Inbox
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import AccountTable from './components/AccountTable';
import AddEditModal from './components/AddEditModal';
import TrashModal from './components/TrashModal';
import ActivityLogModal from './components/ActivityLogModal';
import ImportExportModal from './components/ImportExportModal';
import UnlockModal from './components/UnlockModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '', tags: [] });

  // Dark mode
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Master Password / Locked state
  const [isLocked, setIsLocked] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { type: 'view'|'copy', id, text }

  // Modals visibility
  const [showTrash, setShowTrash] = useState(false);
  const [trashedAccounts, setTrashedAccounts] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Auto-lock after 5 minutes of inactivity
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, 5 * 60 * 1000); // 5 minutes
    };

    if (!isLocked) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      resetTimer();
    }

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timer);
    };
  }, [isLocked]);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/accounts`, { headers: { Authorization: `Bearer ${token}` } });
      setAccounts(res.data);
    } catch (e) {
      if(e.response?.status === 401) onLogout();
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const checkUnlock = (action) => {
    if (!isLocked) return true;
    setPendingAction(action);
    setShowUnlockModal(true);
    return false;
  };

  const togglePwd = (id) => {
    if (!checkUnlock({ type: 'view', id })) return;
    setShowPwd(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, id) => {
    if (!checkUnlock({ type: 'copy', id, text })) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Không tìm thấy thông tin phiên đăng nhập. Vui lòng đăng nhập lại.');
      }
      const user = JSON.parse(userStr);
      const email = user.email;

      if (!email) {
        throw new Error('Không tìm thấy email người dùng.');
      }

      await axios.post(`${API_URL}/api/auth/login`, { email, password: unlockPassword });
      
      setIsLocked(false);
      setShowUnlockModal(false);
      setUnlockPassword('');
      
      if (pendingAction) {
        if (pendingAction.type === 'view') {
          setShowPwd(prev => ({ ...prev, [pendingAction.id]: !prev[pendingAction.id] }));
        } else if (pendingAction.type === 'copy') {
          navigator.clipboard.writeText(pendingAction.text);
          setCopied(pendingAction.id);
          setTimeout(() => setCopied(null), 1500);
        }
        setPendingAction(null);
      }
    } catch (err) {
      console.error('Unlock error:', err);
      setUnlockError(err.response?.data?.error || err.message || 'Mật khẩu không chính xác');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    await axios.delete(`${API_URL}/api/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAccounts();
  };

  const handleOpenAdd = () => {
    setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '', tags: [] });
    setEditingId(null);
    setOpenModal(true);
  };

  const handleEdit = (acc) => {
    setForm({
      account_type: acc.account_type || '',
      account: acc.account || '',
      password: acc.password || '',
      information: acc.information || '',
      gmail_link: acc.gmail_link || '',
      tags: acc.tags || []
    });
    setEditingId(acc.id);
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/accounts/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/accounts`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setOpenModal(false);
      setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '', tags: [] });
      setEditingId(null);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handlePin = async (id, currentPin) => {
    try {
      await axios.patch(`${API_URL}/api/accounts/${id}/pin`, { is_pinned: !currentPin }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/accounts/trash`, { headers: { Authorization: `Bearer ${token}` } });
      setTrashedAccounts(res.data);
    } catch (e) { console.error(e); }
  };

  const handleRestore = async (id) => {
    await axios.post(`${API_URL}/api/accounts/${id}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchTrash();
    fetchAccounts();
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Xóa vĩnh viễn tài khoản này? Hành động không thể hoàn tác.')) return;
    await axios.delete(`${API_URL}/api/accounts/${id}/permanent`, { headers: { Authorization: `Bearer ${token}` } });
    fetchTrash();
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/activity-logs`, { headers: { Authorization: `Bearer ${token}` } });
      setActivityLogs(res.data);
    } catch (e) { console.error(e); }
  };

  const handleExport = (format) => {
    if (format === 'json') {
      const data = accounts.map(({ account_type, account, password, information, gmail_link }) => ({ account_type, account, password, information, gmail_link }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `account-vault-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const header = 'Loại,Tài khoản,Mật khẩu,Ghi chú,Gmail\n';
      const rows = accounts.map(a => [a.account_type, a.account, a.password, a.information, a.gmail_link].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `account-vault-backup-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
    setShowImportExport(false);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let items = [];
    try {
      if (file.name.endsWith('.json')) {
        items = JSON.parse(text);
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        lines.shift();
        items = lines.map(line => {
          const cols = line.match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
          return { account_type: cols[0]||'Khác', account: cols[1]||'', password: cols[2]||'', information: cols[3]||'', gmail_link: cols[4]||'' };
        });
      }
      if (items.length === 0) return alert('Không tìm thấy dữ liệu trong file.');
      await axios.post(`${API_URL}/api/accounts/bulk`, { accounts: items }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Đã nhập ${items.length} tài khoản thành công!`);
      fetchAccounts();
      setShowImportExport(false);
    } catch (err) { alert('Lỗi khi nhập: ' + (err.response?.data?.error || err.message)); }
    e.target.value = '';
  };

  // Helpers
  const actionLabels = { create: 'Tạo mới', update: 'Cập nhật', delete: 'Xóa', restore: 'Khôi phục', pin: 'Ghim', unpin: 'Bỏ ghim' };
  const actionColors = { create: 'text-emerald-500', update: 'text-notion-blue', delete: 'text-red-400', restore: 'text-amber-500', pin: 'text-purple-500', unpin: 'text-warm-gray-300' };
  const timeAgo = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'Vừa xong'; if (s < 3600) return `${Math.floor(s/60)} phút trước`; if (s < 86400) return `${Math.floor(s/3600)} giờ trước`; return `${Math.floor(s/86400)} ngày trước`; };

  // Filter & Group logic
  const filtered = accounts.filter(acc => {
    const searchLower = search.toLowerCase();
    const matchBasic = [acc.account_type, acc.account, acc.information, acc.gmail_link]
      .join(' ').toLowerCase().includes(searchLower);
    const matchTags = (acc.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    return matchBasic || matchTags;
  });
  const pinned = filtered.filter(a => a.is_pinned);
  const unpinned = filtered.filter(a => !a.is_pinned);
  const grouped = unpinned.reduce((g, acc) => {
    const type = acc.account_type || 'Khác';
    if (!g[type]) g[type] = [];
    g[type].push(acc);
    return g;
  }, {});

  return (
    <div className="w-full min-h-screen bg-notion-white dark:bg-[#191919] text-notion-black dark:text-neutral-100 pb-24 overflow-x-hidden">
      <Navbar 
        dark={dark} setDark={setDark} 
        onShowActivity={() => { setShowActivityLog(true); fetchActivityLogs(); }} 
        onShowTrash={() => { setShowTrash(true); fetchTrash(); }} 
        isLocked={isLocked} setIsLocked={setIsLocked} 
        onLogout={onLogout} 
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-[60px] pt-8 sm:pt-[56px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-1.5px] leading-tight text-notion-black dark:text-white">
              Tài khoản của tôi
            </h1>
            <p className="text-[14px] sm:text-[15px] text-warm-gray-500 dark:text-neutral-400 mt-1">
              Quản lý tập trung tất cả tài khoản và mật khẩu.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setShowImportExport(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 border border-whisper dark:border-neutral-700 text-warm-gray-500 dark:text-neutral-400 hover:text-notion-black dark:hover:text-white px-3 py-[10px] sm:py-[8px] rounded-[8px] sm:rounded-[6px] text-[14px] font-medium transition hover:bg-warm-white dark:hover:bg-neutral-800">
              Xuất/Nhập
            </button>
            <button onClick={handleOpenAdd} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-notion-blue hover:bg-notion-blue-hover text-white px-4 py-[10px] sm:py-[8px] rounded-[8px] sm:rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98] shadow-sm">
              <Plus size={16}/>Thêm mới
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-300" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản hoặc #tag..."
            className="w-full bg-warm-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[8px] pl-9 pr-4 py-[9px] text-[14px] text-notion-black dark:text-neutral-100 placeholder:text-warm-gray-300 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tag Filters */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <button 
              onClick={() => setSearch('')}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition ${search === '' ? 'bg-notion-blue text-white' : 'bg-warm-white dark:bg-neutral-800 text-warm-gray-500 hover:bg-whisper'}`}
            >
              Tất cả
            </button>
            {Array.from(new Set(accounts.flatMap(a => a.tags || []))).map(tag => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition ${search === tag ? 'bg-notion-blue text-white' : 'bg-warm-white dark:bg-neutral-800 text-warm-gray-500 hover:bg-whisper'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Pinned Accounts */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 px-2 py-[3px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold tracking-[0.5px] uppercase">
                <Pin size={12} className="fill-amber-400 stroke-amber-400" />
                <span>Đã ghim</span>
              </div>
              <span className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{pinned.length} tài khoản</span>
            </div>
            <AccountTable 
              accounts={pinned} 
              showPwd={showPwd} 
              onTogglePwd={togglePwd} 
              onCopy={handleCopy} 
              copied={copied} 
              onPin={handlePin} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              isPinnedTable={true}
            />
          </div>
        )}

        {/* Grouped Accounts */}
        {Object.keys(grouped).length === 0 && pinned.length === 0 ? (
          <div className="text-center py-16 border border-whisper dark:border-neutral-800 rounded-[12px] bg-warm-white/50 dark:bg-neutral-800/30">
            <div className="flex justify-center mb-3">
              <Inbox size={32} className="text-warm-gray-300 dark:text-neutral-600" />
            </div>
            <p className="text-[15px] text-warm-gray-500 dark:text-neutral-400 font-medium">Chưa có tài khoản nào</p>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2 py-[3px] bg-badge-bg dark:bg-blue-500/10 text-badge-text dark:text-blue-400 rounded-full text-[11px] font-bold tracking-[0.5px] uppercase">{type}</span>
                <span className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{items.length} tài khoản</span>
              </div>
              <AccountTable 
                accounts={items} 
                showPwd={showPwd} 
                onTogglePwd={togglePwd} 
                onCopy={handleCopy} 
                copied={copied} 
                onPin={handlePin} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
              />
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {openModal && (
          <AddEditModal 
            editingId={editingId} 
            form={form} 
            setForm={setForm} 
            onSave={handleSave} 
            onClose={() => setOpenModal(false)} 
          />
        )}

        {showTrash && (
          <TrashModal 
            accounts={trashedAccounts} 
            onClose={() => setShowTrash(false)} 
            onRestore={handleRestore} 
            onPermanentDelete={handlePermanentDelete} 
            timeAgo={timeAgo} 
          />
        )}

        {showActivityLog && (
          <ActivityLogModal 
            logs={activityLogs} 
            onClose={() => setShowActivityLog(false)} 
            actionLabels={actionLabels} 
            actionColors={actionColors} 
            timeAgo={timeAgo} 
          />
        )}

        {showImportExport && (
          <ImportExportModal 
            onClose={() => setShowImportExport(false)} 
            onExport={handleExport} 
            onImport={handleImportFile} 
          />
        )}

        {showUnlockModal && (
          <UnlockModal 
            unlockPassword={unlockPassword} 
            setUnlockPassword={setUnlockPassword} 
            unlockError={unlockError} 
            setUnlockError={setUnlockError} 
            onUnlock={handleUnlock} 
            onClose={() => { setShowUnlockModal(false); setPendingAction(null); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
