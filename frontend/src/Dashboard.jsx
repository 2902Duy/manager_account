import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Star, Shield, Moon, Sun, Settings, Inbox
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AccountTable from './components/AccountTable';
import AddEditModal from './components/AddEditModal';
import TrashModal from './components/TrashModal';
import ActivityLogModal from './components/ActivityLogModal';
import ImportExportModal from './components/ImportExportModal';
import UnlockModal from './components/UnlockModal';
import PasswordInput from './components/PasswordInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '', tags: [] });

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('vault');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isLocked, setIsLocked] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordStatus, setChangePasswordStatus] = useState({ type: '', message: '' });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Auto-lock logic
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsLocked(true), 10 * 60 * 1000); // 10 mins
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
      if (e.response?.status === 401) onLogout();
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Handlers
  const checkUnlock = (action) => {
    if (!isLocked) return true;
    setPendingAction(action);
    setShowUnlockModal(true);
    return false;
  };

  const handleTogglePwd = (id) => {
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
      await axios.post(`${API_URL}/api/auth/login`, { email: user.email, password: unlockPassword });
      setIsLocked(false);
      setShowUnlockModal(false);
      setUnlockPassword('');
      if (pendingAction) {
        if (pendingAction.type === 'view') setShowPwd(prev => ({ ...prev, [pendingAction.id]: !prev[pendingAction.id] }));
        else if (pendingAction.type === 'copy') {
          navigator.clipboard.writeText(pendingAction.text);
          setCopied(pendingAction.id);
          setTimeout(() => setCopied(null), 1500);
        }
        setPendingAction(null);
      }
    } catch (err) { setUnlockError('Mật khẩu không chính xác'); }
  };

  const handlePin = async (id, currentPin) => {
    try {
      await axios.patch(`${API_URL}/api/accounts/${id}/pin`, { is_pinned: !currentPin }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Chuyển tài khoản này vào thùng rác?')) return;
    await axios.delete(`${API_URL}/api/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAccounts();
  };

  const handleOpenAdd = () => {
    setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '', tags: [] });
    setEditingId(null);
    setOpenModal(true);
  };

  const handleEdit = (acc) => {
    setForm({ ...acc, tags: acc.tags || [] });
    setEditingId(acc.id);
    setOpenModal(true);
  };

  const handleSave = async (e, formOverride) => {
    e.preventDefault();
    const payload = formOverride || form;
    try {
      if (editingId) await axios.put(`${API_URL}/api/accounts/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.post(`${API_URL}/api/accounts`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setOpenModal(false);
      fetchAccounts();
    } catch (err) { alert(err.response?.data?.error || 'Lỗi lưu dữ liệu'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordStatus({ type: '', message: '' });

    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      return setChangePasswordStatus({ type: 'error', message: 'Vui lòng nhập đầy đủ thông tin mật khẩu.' });
    }
    if (changePasswordForm.newPassword.length < 6) {
      return setChangePasswordStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      return setChangePasswordStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
    }
    if (changePasswordForm.currentPassword === changePasswordForm.newPassword) {
      return setChangePasswordStatus({ type: 'error', message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    }

    setChangePasswordLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordStatus({ type: 'success', message: 'Đã đổi mật khẩu thành công.' });
      setIsLocked(true);
    } catch (err) {
      setChangePasswordStatus({ type: 'error', message: err.response?.data?.error || 'Không thể đổi mật khẩu.' });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Filter Logic
  const filtered = accounts.filter(acc => {
    const searchLower = search.toLowerCase();
    const matchBasic = [acc.account_type, acc.account].join(' ').toLowerCase().includes(searchLower);
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

  // Tab Content Renders
  const renderVault = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-notion-black dark:text-white tracking-tight">Danh sách tài khoản</h1>
          <p className="text-warm-gray-500 dark:text-neutral-400">Nơi lưu trữ an toàn tất cả thông tin đăng nhập của bạn.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center justify-center gap-2 bg-notion-blue hover:bg-notion-blue-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-notion-blue/20 transition-all active:scale-[0.98]">
          <Plus size={20} /> Thêm mới
        </button>
      </header>

      <div className="relative mb-8">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray-300" />
        <input
          type="text" placeholder="Tìm theo loại tài khoản, tên tài khoản hoặc #tag..."
          className="w-full bg-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-2xl pl-12 pr-4 py-4 text-[16px] shadow-sm focus:outline-none focus:ring-4 focus:ring-notion-blue/10 focus:border-notion-blue transition-all"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {pinned.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4 px-2 text-amber-500 font-bold uppercase tracking-widest text-[12px]">
            <Star size={16} className="fill-amber-500" />
            <span>Đã ghim quan trọng</span>
          </div>
          <AccountTable accounts={pinned} showPwd={showPwd} copied={copied} onTogglePwd={handleTogglePwd} onCopy={handleCopy} onPin={handlePin} onEdit={handleEdit} onDelete={handleDelete} isPinnedTable />
        </div>
      )}

      {Object.keys(grouped).length > 0 ? Object.entries(grouped).map(([type, accs]) => (
        <div key={type} className="mb-10">
          <h2 className="text-[14px] font-bold text-warm-gray-400 mb-4 px-2 uppercase tracking-widest">{type}</h2>
          <AccountTable accounts={accs} showPwd={showPwd} copied={copied} onTogglePwd={handleTogglePwd} onCopy={handleCopy} onPin={handlePin} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      )) : pinned.length === 0 && (
        <div className="py-24 text-center bg-white dark:bg-neutral-800/50 rounded-3xl border-2 border-dashed border-whisper dark:border-neutral-700">
          <Shield size={48} className="mx-auto mb-4 text-warm-gray-100" />
          <p className="text-warm-gray-400 font-medium">Chưa có tài khoản nào được lưu.</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'activity': return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-[28px] sm:text-[32px] font-bold mb-2">Nhật ký hoạt động</h1>
          <p className="text-warm-gray-500 mb-8">Theo dõi các thay đổi và truy cập vào kho dữ liệu.</p>
          <ActivityLogModal inline token={token} />
        </div>
      );
      case 'trash': return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-[32px] font-bold mb-2">Thùng rác</h1>
          <p className="text-warm-gray-500 mb-8">Các mục đã xóa sẽ được giữ lại trong 30 ngày.</p>
          <TrashModal inline token={token} onRestore={fetchAccounts} />
        </div>
      );
      case 'settings': return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
          <h1 className="text-[32px] font-bold mb-2">Cài đặt</h1>
          <p className="text-warm-gray-500 mb-8">Quản lý bảo mật, giao diện và dữ liệu cá nhân của bạn.</p>
          
          <div className="grid gap-6">
            {/* Giao diện */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
              <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
                <Moon size={18} className="text-notion-blue" /> Chế độ hiển thị
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[14px]">Giao diện tối (Dark Mode)</p>
                  <p className="text-[13px] text-warm-gray-400">Tự động điều chỉnh màu sắc phù hợp với môi trường.</p>
                </div>
                <button onClick={() => setDark(!dark)} className={`w-12 h-6 rounded-full transition-all relative ${dark ? 'bg-notion-blue' : 'bg-warm-white border border-whisper'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${dark ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Bảo mật */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
              <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
                <Shield size={18} className="text-emerald-500" /> Bảo mật tài khoản
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[14px]">Trạng thái Vault</p>
                    <p className="text-[13px] text-warm-gray-400">Khóa kho dữ liệu ngay lập tức.</p>
                  </div>
                  <button 
                    onClick={() => isLocked ? setShowUnlockModal(true) : setIsLocked(true)}
                    className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all border ${
                      isLocked 
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20'
                    }`}
                  >
                    {isLocked ? 'Đang khóa (Mở ngay)' : 'Đang mở (Khóa ngay)'}
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="pt-4 border-t border-whisper dark:border-neutral-700">
                  <div className="mb-4">
                    <p className="font-semibold text-[14px]">Thay đổi mật khẩu</p>
                    <p className="text-[13px] text-warm-gray-400">Nhập mật khẩu hiện tại để xác minh, sau đó đặt mật khẩu mới.</p>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Mật khẩu hiện tại</label>
                      <PasswordInput
                        required
                        placeholder="Nhập mật khẩu hiện tại"
                        className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                        value={changePasswordForm.currentPassword}
                        onChange={e => {
                          setChangePasswordStatus({ type: '', message: '' });
                          setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value });
                        }}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Mật khẩu mới</label>
                        <PasswordInput
                          required
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                          value={changePasswordForm.newPassword}
                          onChange={e => {
                            setChangePasswordStatus({ type: '', message: '' });
                            setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value });
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Xác nhận mật khẩu mới</label>
                        <PasswordInput
                          required
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                          value={changePasswordForm.confirmPassword}
                          onChange={e => {
                            setChangePasswordStatus({ type: '', message: '' });
                            setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {changePasswordStatus.message && (
                    <p className={`mt-3 text-[12px] font-medium ${changePasswordStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {changePasswordStatus.message}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordLoading}
                      className="px-4 py-2 bg-notion-blue text-white hover:bg-notion-blue-hover disabled:opacity-60 rounded-lg text-[13px] font-bold transition"
                    >
                      {changePasswordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Dữ liệu */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
              <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
                <Settings size={18} className="text-warm-gray-400" /> Quản lý dữ liệu
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[14px]">Sao lưu & Phục hồi</p>
                  <p className="text-[13px] text-warm-gray-400">Tải về hoặc nhập dữ liệu từ file CSV/JSON.</p>
                </div>
                <button onClick={() => setShowImportExport(true)} className="px-5 py-2 bg-notion-blue text-white hover:bg-notion-blue-hover rounded-lg text-[13px] font-bold transition shadow-sm">
                  Quản lý
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      default: return renderVault();
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#121212] flex">
      {/* Sidebar - Desktop */}
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        dark={dark} setDark={setDark}
        isLocked={isLocked} onLogout={onLogout}
        onLock={() => isLocked ? setShowUnlockModal(true) : setIsLocked(true)}
        userEmail={user.email}
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pb-24 md:pb-12 ${isCollapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'}`}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-12">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Shared Modals */}
      <AnimatePresence>
        {openModal && (
          <AddEditModal
            editingId={editingId} form={form} setForm={setForm}
            onSave={handleSave} onClose={() => setOpenModal(false)}
          />
        )}
        {showUnlockModal && (
          <UnlockModal
            unlockPassword={unlockPassword} setUnlockPassword={setUnlockPassword}
            unlockError={unlockError} setUnlockError={setUnlockError}
            onUnlock={handleUnlock} onClose={() => { setShowUnlockModal(false); setPendingAction(null); }}
          />
        )}
        {showImportExport && (
          <ImportExportModal
            onClose={() => setShowImportExport(false)}
            onExport={(format) => { /* Reuse export logic from before */ }}
            onImport={async (e) => { /* Reuse import logic */ }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
