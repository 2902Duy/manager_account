import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Star, Shield
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
import SettingsPanel from './components/SettingsPanel';
import DriveImageManager from './components/DriveImageManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const LOCAL_DEV_TOKEN = 'local-dev-token';
const LOCAL_ACCOUNTS_KEY = 'local-dev-accounts';
const AUTO_LOCK_MINUTES_KEY = 'dlock-auto-lock-minutes';
const LOCAL_TEST_PASSWORD = 'Test@123456';
const LOCAL_SAMPLE_ACCOUNTS = [
  {
    id: 1,
    account_type: 'Email',
    account: 'demo@gmail.com',
    password: 'Gmail@Test123!',
    information: 'Tai khoan mau de kiem tra giao dien local',
    gmail_link: 'demo@gmail.com',
    tags: ['demo', 'local'],
    strength_score: 90,
    is_pinned: true,
  },
  {
    id: 2,
    account_type: 'Game',
    account: 'demo_player',
    password: 'Game@Test123!',
    information: 'Du lieu chi nam trong localStorage cua trinh duyet',
    gmail_link: '',
    tags: ['test'],
    strength_score: 85,
    is_pinned: false,
  },
];

const readLocalAccounts = () => {
  try {
    const saved = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(LOCAL_SAMPLE_ACCOUNTS));
  return LOCAL_SAMPLE_ACCOUNTS;
};

const writeLocalAccounts = (nextAccounts) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
};

const getApiErrorMessage = (err) => {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status) return `Lỗi ${err.response.status}: Không thể lưu dữ liệu`;
  if (err.request) return 'Không kết nối được máy chủ API. Kiểm tra VITE_API_URL hoặc backend đang chạy.';
  return 'Lỗi lưu dữ liệu';
};

const sanitizeAccountForExport = (acc) => ({
  account_type: acc.account_type || '',
  account: acc.account || '',
  password: acc.password || '',
  information: acc.information || '',
  gmail_link: acc.gmail_link || '',
  tags: Array.isArray(acc.tags) ? acc.tags : [],
});

const downloadTextFile = (filename, content, type = 'application/json') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const bytesToBase64 = (bytes) => {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary);
};
const base64ToBytes = (value) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

const deriveExportKey = async (passphrase, salt) => {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptExportPayload = async (payload, passphrase) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveExportKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );

  return {
    format: 'dlock-encrypted-export',
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: 250000,
    cipher: 'AES-256-GCM',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(ciphertext),
  };
};

const decryptExportPayload = async (payload, passphrase) => {
  if (payload?.format !== 'dlock-encrypted-export') {
    throw new Error('Unsupported export format');
  }

  const key = await deriveExportKey(passphrase, base64ToBytes(payload.salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.data)
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
};

const accountsToCsv = (accounts) => {
  const headers = ['account_type', 'account', 'password', 'information', 'gmail_link', 'tags'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [
    headers.join(','),
    ...accounts.map(acc => headers.map(header => {
      const value = header === 'tags' ? (acc.tags || []).join('|') : acc[header];
      return escape(value);
    }).join(',')),
  ].join('\n');
};

export default function Dashboard({ token, onLogout }) {
  const isLocalDevSession = import.meta.env.DEV && token === LOCAL_DEV_TOKEN;
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ account_type: '', account: '', password: '', information: '', gmail_link: '', tags: [] });
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('vault');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [autoLockMinutes, setAutoLockMinutes] = useState(() => Number(localStorage.getItem(AUTO_LOCK_MINUTES_KEY) || 10));
  const [isLocked, setIsLocked] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordStatus, setChangePasswordStatus] = useState({ type: '', message: '' });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const lockVault = () => {
    setIsLocked(true);
    setVaultPassword('');
    setShowPwd({});
    setAccounts(prev => prev.map(acc => ({ ...acc, password: null })));
  };

  const revealAccountPassword = async (id, passwordOverride = vaultPassword) => {
    if (isLocalDevSession) {
      const localAccount = readLocalAccounts().find(acc => acc.id === id);
      return localAccount?.password || '';
    }

    const res = await axios.post(
      `${API_URL}/api/accounts/${id}/reveal`,
      { currentPassword: passwordOverride },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const revealedPassword = res.data.password || '';
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, password: revealedPassword } : acc));
    return revealedPassword;
  };

  const openEditModal = (acc, password) => {
    setForm({ ...acc, password: password || acc.password || '', tags: acc.tags || [] });
    setEditingId(acc.id);
    setOpenModal(true);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(AUTO_LOCK_MINUTES_KEY, String(autoLockMinutes));
  }, [autoLockMinutes]);

  // Auto-lock logic
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      if (autoLockMinutes > 0) timer = setTimeout(lockVault, autoLockMinutes * 60 * 1000);
    };
    if (!isLocked && autoLockMinutes > 0) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('touchstart', resetTimer);
      resetTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(timer);
    };
  }, [isLocked, autoLockMinutes]);

  const fetchAccounts = async () => {
    if (isLocalDevSession) {
      setAccounts(readLocalAccounts());
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: search.trim() || undefined,
          limit: 500,
        },
      });
      setAccounts(res.data);
    } catch (e) {
      if (e.response?.status === 401) onLogout();
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLocalDevSession) return;
    const timer = setTimeout(() => {
      fetchAccounts();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Handlers
  const checkUnlock = (action) => {
    if (!isLocked) return true;
    setPendingAction(action);
    setShowUnlockModal(true);
    return false;
  };

  const handleTogglePwd = async (id) => {
    if (!checkUnlock({ type: 'view', id })) return;
    if (showPwd[id]) {
      setShowPwd(prev => ({ ...prev, [id]: false }));
      return;
    }

    try {
      await revealAccountPassword(id);
      setShowPwd(prev => ({ ...prev, [id]: true }));
    } catch {
      setUnlockError('Không thể mở mật khẩu. Vui lòng khóa và mở lại vault.');
      lockVault();
      setShowUnlockModal(true);
    }
  };

  const handleCopy = async (_text, id) => {
    if (!checkUnlock({ type: 'copy', id })) return;
    try {
      const current = accounts.find(acc => acc.id === id);
      const passwordToCopy = current?.password || await revealAccountPassword(id);
      await navigator.clipboard.writeText(passwordToCopy);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setUnlockError('Không thể sao chép mật khẩu. Vui lòng khóa và mở lại vault.');
      lockVault();
      setShowUnlockModal(true);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    try {
      const enteredPassword = unlockPassword;
      if (isLocalDevSession) {
        if (enteredPassword !== LOCAL_TEST_PASSWORD) throw new Error('Invalid local password');
        setIsLocked(false);
        setVaultPassword(enteredPassword);
        setShowUnlockModal(false);
        setUnlockPassword('');
        if (pendingAction) {
          if (pendingAction.type === 'view') {
            const revealedPassword = await revealAccountPassword(pendingAction.id, enteredPassword);
            setAccounts(prev => prev.map(acc => acc.id === pendingAction.id ? { ...acc, password: revealedPassword } : acc));
            setShowPwd(prev => ({ ...prev, [pendingAction.id]: true }));
          }
          else if (pendingAction.type === 'copy') {
            const localAccount = readLocalAccounts().find(acc => acc.id === pendingAction.id);
            navigator.clipboard.writeText(localAccount?.password || '');
            setCopied(pendingAction.id);
            setTimeout(() => setCopied(null), 1500);
          } else if (pendingAction.type === 'edit') {
            const localAccount = readLocalAccounts().find(acc => acc.id === pendingAction.id);
            if (localAccount) openEditModal(localAccount, localAccount.password);
          }
          setPendingAction(null);
        }
        return;
      }

      await axios.post(`${API_URL}/api/auth/login`, { email: user.email, password: enteredPassword });
      setIsLocked(false);
      setVaultPassword(enteredPassword);
      setShowUnlockModal(false);
      setUnlockPassword('');
      if (pendingAction) {
        if (pendingAction.type === 'view') {
          await revealAccountPassword(pendingAction.id, enteredPassword);
          setShowPwd(prev => ({ ...prev, [pendingAction.id]: true }));
        }
        else if (pendingAction.type === 'copy') {
          const passwordToCopy = await revealAccountPassword(pendingAction.id, enteredPassword);
          await navigator.clipboard.writeText(passwordToCopy);
          setCopied(pendingAction.id);
          setTimeout(() => setCopied(null), 1500);
        } else if (pendingAction.type === 'edit') {
          const accountToEdit = accounts.find(acc => acc.id === pendingAction.id);
          if (accountToEdit) {
            const revealedPassword = await revealAccountPassword(pendingAction.id, enteredPassword);
            openEditModal(accountToEdit, revealedPassword);
          }
        }
        setPendingAction(null);
      }
    } catch { setUnlockError('Mật khẩu không chính xác'); }
  };

  const handlePin = async (id, currentPin) => {
    if (isLocalDevSession) {
      const next = accounts.map(acc => acc.id === id ? { ...acc, is_pinned: !currentPin } : acc);
      setAccounts(next);
      writeLocalAccounts(next);
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/accounts/${id}/pin`, { is_pinned: !currentPin }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Chuyển tài khoản này vào thùng rác?')) return;
    if (isLocalDevSession) {
      const next = accounts.filter(acc => acc.id !== id);
      setAccounts(next);
      writeLocalAccounts(next);
      return;
    }

    await axios.delete(`${API_URL}/api/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAccounts();
  };

  const handleOpenAdd = () => {
    setForm({ account_type: '', account: '', password: '', information: '', gmail_link: '', tags: [] });
    setSaveError('');
    setEditingId(null);
    setOpenModal(true);
  };

  const handleEdit = async (acc) => {
    if (!checkUnlock({ type: 'edit', id: acc.id })) return;

    try {
      const revealedPassword = acc.password || await revealAccountPassword(acc.id);
      openEditModal(acc, revealedPassword);
    } catch {
      setUnlockError('Không thể mở thông tin sửa. Vui lòng khóa và mở lại vault.');
      lockVault();
      setShowUnlockModal(true);
    }
  };

  const handleSave = async (e, formOverride) => {
    e.preventDefault();
    const payload = formOverride || form;
    setSaveError('');
    if (isLocalDevSession) {
      const next = editingId
        ? accounts.map(acc => acc.id === editingId ? { ...acc, ...payload, id: editingId } : acc)
        : [...accounts, { ...payload, id: Date.now(), strength_score: 0, is_pinned: false }];
      setAccounts(next);
      writeLocalAccounts(next);
      setOpenModal(false);
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) await axios.put(`${API_URL}/api/accounts/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.post(`${API_URL}/api/accounts`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setOpenModal(false);
      fetchAccounts();
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
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
      if (isLocalDevSession) {
        if (changePasswordForm.currentPassword !== LOCAL_TEST_PASSWORD) {
          setChangePasswordStatus({ type: 'error', message: 'Mat khau local hien tai khong dung.' });
          return;
        }
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setChangePasswordStatus({ type: 'success', message: 'Local test: khong doi mat khau that.' });
        lockVault();
        return;
      }

      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordStatus({ type: 'success', message: 'Đã đổi mật khẩu thành công.' });
      lockVault();
    } catch (err) {
      setChangePasswordStatus({ type: 'error', message: err.response?.data?.error || 'Không thể đổi mật khẩu.' });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const getExportAccounts = async () => {
    if (isLocked) {
      alert('Unlock the vault before exporting data.');
      setShowUnlockModal(true);
      throw new Error('Vault is locked');
    }

    if (isLocalDevSession) return readLocalAccounts().map(sanitizeAccountForExport);

    const exported = [];
    for (const account of accounts) {
      const password = account.password || await revealAccountPassword(account.id);
      exported.push(sanitizeAccountForExport({ ...account, password }));
    }
    return exported;
  };

  const handleEncryptedExport = async (format, passphrase) => {
    try {
      const exportedAccounts = await getExportAccounts();
      const payload = {
        exported_at: new Date().toISOString(),
        format,
        accounts: exportedAccounts,
        content: format === 'csv' ? accountsToCsv(exportedAccounts) : null,
      };
      const encrypted = await encryptExportPayload(payload, passphrase);
      const date = new Date().toISOString().slice(0, 10);
      downloadTextFile(`dlock-export-${date}.${format}.encrypted.json`, JSON.stringify(encrypted, null, 2));
    } catch (err) {
      if (err.message !== 'Vault is locked') {
        throw new Error('Could not export data. Check the vault state.');
      }
      throw err;
    }
  };

  const handleEncryptedImport = async (file, passphrase) => {
    try {
      const encrypted = JSON.parse(await file.text());
      const decrypted = await decryptExportPayload(encrypted, passphrase);
      const importedAccounts = (decrypted.accounts || []).map(sanitizeAccountForExport);
      if (importedAccounts.length === 0) {
        throw new Error('No accounts found in this file.');
      }

      if (isLocalDevSession) {
        const next = [...accounts, ...importedAccounts.map((acc, index) => ({
          ...acc,
          id: Date.now() + index,
          strength_score: 0,
          is_pinned: false,
        }))];
        setAccounts(next);
        writeLocalAccounts(next);
      } else {
        await axios.post(
          `${API_URL}/api/accounts/bulk`,
          { accounts: importedAccounts },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchAccounts();
      }

      alert(`Imported ${importedAccounts.length} accounts.`);
      setShowImportExport(false);
    } catch (err) {
      throw new Error('Could not import this file. The passphrase or file format may be wrong.');
    }
  };

  // Filter Logic
  const filtered = accounts.filter(acc => {
    const searchLower = search.toLowerCase();
    const tagSearch = searchLower.startsWith('#') ? searchLower.slice(1) : searchLower;
    const matchBasic = [acc.account_type, acc.account].join(' ').toLowerCase().includes(searchLower);
    const matchTags = (acc.tags || []).some(tag => tag.toLowerCase().includes(tagSearch));
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
      case 'images': return <DriveImageManager onOpenSettings={() => setActiveTab('settings')} />;
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
        <SettingsPanel
          dark={dark}
          setDark={setDark}
          isLocked={isLocked}
          onToggleVaultLock={() => isLocked ? setShowUnlockModal(true) : lockVault()}
          autoLockMinutes={autoLockMinutes}
          setAutoLockMinutes={setAutoLockMinutes}
          changePasswordForm={changePasswordForm}
          setChangePasswordForm={setChangePasswordForm}
          changePasswordStatus={changePasswordStatus}
          setChangePasswordStatus={setChangePasswordStatus}
          changePasswordLoading={changePasswordLoading}
          onChangePassword={handleChangePassword}
          onOpenImportExport={() => setShowImportExport(true)}
        />
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
        onLock={() => isLocked ? setShowUnlockModal(true) : lockVault()}
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
            onSave={handleSave} onClose={() => { setSaveError(''); setOpenModal(false); }}
            accounts={accounts}
            saveError={saveError}
            isSaving={isSaving}
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
            onExport={handleEncryptedExport}
            onImport={handleEncryptedImport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
