import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Trash2, Plus, Search, Copy, Check, LogOut, Edit2, Sun, Moon, Pin, PinOff, Download, Upload, Clock, RotateCcw, X, MoreHorizontal } from 'lucide-react';
import PasswordGenerator from './PasswordGenerator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '' });

  // Dark mode
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Trash
  const [showTrash, setShowTrash] = useState(false);
  const [trashedAccounts, setTrashedAccounts] = useState([]);

  // Activity Log
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);

  // Import/Export
  const [showImportExport, setShowImportExport] = useState(false);

  // Toolbar menu
  const [showToolMenu, setShowToolMenu] = useState(false);

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

  const togglePwd = (id) => setShowPwd(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDelete = async (id) => {
    if(!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    await axios.delete(`${API_URL}/api/accounts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAccounts();
  };

  const handleOpenAdd = () => {
    setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '' });
    setEditingId(null);
    setOpenModal(true);
  };

  const handleEdit = (acc) => {
    setForm({
      account_type: acc.account_type || '',
      account: acc.account || '',
      password: acc.password || '',
      information: acc.information || '',
      gmail_link: acc.gmail_link || ''
    });
    setEditingId(acc.id);
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/api/accounts/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post(`${API_URL}/api/accounts`, form, { headers: { Authorization: `Bearer ${token}` } });
    }
    setOpenModal(false);
    setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '' });
    setEditingId(null);
    fetchAccounts();
  };

  // Lọc tài khoản theo từ khóa
  const filtered = accounts.filter(acc =>
    [acc.account_type, acc.account, acc.information, acc.gmail_link]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  );

  // Nhóm theo loại — pinned accounts đứng đầu
  const pinned = filtered.filter(a => a.is_pinned);
  const unpinned = filtered.filter(a => !a.is_pinned);
  const grouped = unpinned.reduce((g, acc) => {
    const type = acc.account_type || 'Khác';
    if (!g[type]) g[type] = [];
    g[type].push(acc);
    return g;
  }, {});

  // ─── Pin Toggle ───
  const handlePin = async (id, currentPin) => {
    try {
      await axios.patch(`${API_URL}/api/accounts/${id}/pin`, { is_pinned: !currentPin }, { headers: { Authorization: `Bearer ${token}` } });
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  // ─── Trash Functions ───
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

  // ─── Activity Log ───
  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/activity-logs`, { headers: { Authorization: `Bearer ${token}` } });
      setActivityLogs(res.data);
    } catch (e) { console.error(e); }
  };

  // ─── Export ───
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

  // ─── Import ───
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let items = [];
    if (file.name.endsWith('.json')) {
      items = JSON.parse(text);
    } else {
      const lines = text.split('\n').filter(l => l.trim());
      lines.shift(); // remove header
      items = lines.map(line => {
        const cols = line.match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
        return { account_type: cols[0]||'Khác', account: cols[1]||'', password: cols[2]||'', information: cols[3]||'', gmail_link: cols[4]||'' };
      });
    }
    if (items.length === 0) return alert('Không tìm thấy dữ liệu trong file.');
    try {
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

  return (
    <div className="w-full min-h-screen bg-notion-white dark:bg-[#191919] text-notion-black dark:text-neutral-100 pb-24 overflow-x-hidden">
      {/* Thanh điều hướng */}
      <nav className="flex justify-between items-center h-[54px] px-4 sm:px-6 border-b border-whisper dark:border-neutral-800 bg-notion-white dark:bg-[#202020] sticky top-0 z-10">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img src="/logo.png" alt="Account Vault" className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] object-contain" />
          <span className="text-[14px] sm:text-[15px] font-semibold text-notion-black dark:text-neutral-100">Account Vault</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setDark(!dark)} className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => { setShowActivityLog(true); fetchActivityLogs(); }} className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title="Lịch sử">
            <Clock size={16} />
          </button>
          <button onClick={() => { setShowTrash(true); fetchTrash(); }} className="relative p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-warm-white dark:hover:bg-neutral-800 transition" title="Thùng rác">
            <Trash2 size={16} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-warm-gray-500 dark:text-neutral-400 hover:text-notion-black dark:hover:text-white transition px-3 py-1.5 rounded-[6px] hover:bg-warm-white dark:hover:bg-neutral-800">
            <LogOut size={15} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Nội dung chính */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-[60px] pt-8 sm:pt-[56px]">
        
        {/* Phần tiêu đề */}
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
              <Download size={14}/>Xuất/Nhập
            </button>
            <button onClick={handleOpenAdd} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-notion-blue hover:bg-notion-blue-hover text-white px-4 py-[10px] sm:py-[8px] rounded-[8px] sm:rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98] shadow-sm">
              <Plus size={16}/>Thêm mới
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-300" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            className="w-full bg-warm-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[8px] pl-9 pr-4 py-[9px] text-[14px] text-notion-black dark:text-neutral-100 placeholder:text-warm-gray-300 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-warm-gray-300">
              {filtered.length} kết quả
            </span>
          )}
        </div>

        {/* Pinned Accounts */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block px-2 py-[3px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold tracking-[0.5px] uppercase">📌 Đã ghim</span>
              <span className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{pinned.length} tài khoản</span>
            </div>
            <div className="w-full bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-800 rounded-[10px] shadow-whisper overflow-hidden">
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
                    {pinned.map(acc => (
                      <tr key={acc.id} className="hover:bg-warm-white/60 dark:hover:bg-neutral-800/60 transition group align-top border-b border-whisper dark:border-neutral-800 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-[14px] text-notion-black dark:text-neutral-100 truncate" title={acc.account}>{acc.account}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="font-mono text-[13px] text-warm-gray-500 dark:text-neutral-400 bg-warm-white dark:bg-neutral-800 px-1.5 py-[2px] rounded-[4px] truncate">{showPwd[acc.id] ? acc.password : '••••••••'}</span>
                            <div className="flex flex-shrink-0">
                              <button onClick={() => togglePwd(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-warm-gray-500 dark:hover:text-neutral-300 transition p-1 rounded-[4px]">{showPwd[acc.id] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                              <button onClick={() => handleCopy(acc.password, acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-notion-blue transition p-1 rounded-[4px]">{copied === acc.id ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>}</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.information || '—'}</td>
                        <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.gmail_link || '—'}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handlePin(acc.id, true)} className="text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition p-1.5 rounded-[6px]" title="Bỏ ghim"><PinOff size={15}/></button>
                            <button onClick={() => handleEdit(acc)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-notion-blue/10 hover:text-notion-blue transition p-1.5 rounded-[6px]" title="Sửa"><Edit2 size={15}/></button>
                            <button onClick={() => handleDelete(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition p-1.5 rounded-[6px]" title="Xóa"><Trash2 size={15}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bảng dữ liệu — nhóm theo loại */}
        {Object.keys(grouped).length === 0 && pinned.length === 0 ? (
          <div className="text-center py-16 border border-whisper dark:border-neutral-800 rounded-[12px] bg-warm-white/50 dark:bg-neutral-800/30">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-[15px] text-warm-gray-500 dark:text-neutral-400 font-medium">Chưa có tài khoản nào</p>
            <p className="text-[13px] text-warm-gray-300 dark:text-neutral-500 mt-1">Bấm "Thêm mới" để bắt đầu lưu trữ.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2 py-[3px] bg-badge-bg dark:bg-blue-500/10 text-badge-text dark:text-blue-400 rounded-full text-[11px] font-bold tracking-[0.5px] uppercase">{type}</span>
                <span className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{items.length} tài khoản</span>
              </div>
              <div className="w-full bg-notion-white dark:bg-[#252525] border border-whisper dark:border-neutral-800 rounded-[10px] shadow-whisper overflow-hidden">
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
                      {items.map(acc => (
                        <tr key={acc.id} className="hover:bg-warm-white/60 dark:hover:bg-neutral-800/60 transition group align-top border-b border-whisper dark:border-neutral-800 last:border-b-0">
                          <td className="px-4 py-3 font-medium text-[14px] text-notion-black dark:text-neutral-100 truncate" title={acc.account}>{acc.account}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="font-mono text-[13px] text-warm-gray-500 dark:text-neutral-400 bg-warm-white dark:bg-neutral-800 px-1.5 py-[2px] rounded-[4px] truncate">{showPwd[acc.id] ? acc.password : '••••••••'}</span>
                              <div className="flex flex-shrink-0">
                                <button onClick={() => togglePwd(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-warm-gray-500 dark:hover:text-neutral-300 transition p-1 rounded-[4px]">{showPwd[acc.id] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                                <button onClick={() => handleCopy(acc.password, acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:text-notion-blue transition p-1 rounded-[4px]">{copied === acc.id ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>}</button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.information || '—'}</td>
                          <td className="px-4 py-3 text-warm-gray-500 dark:text-neutral-400 truncate text-[13px]">{acc.gmail_link || '—'}</td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => handlePin(acc.id, false)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500 transition p-1.5 rounded-[6px]" title="Ghim"><Pin size={15}/></button>
                              <button onClick={() => handleEdit(acc)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-notion-blue/10 hover:text-notion-blue transition p-1.5 rounded-[6px]" title="Sửa"><Edit2 size={15}/></button>
                              <button onClick={() => handleDelete(acc.id)} className="text-warm-gray-300 dark:text-neutral-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition p-1.5 rounded-[6px]" title="Xóa"><Trash2 size={15}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Gợi ý vuốt ngang trên điện thoại */}
        {accounts.length > 0 && (
          <div className="block sm:hidden text-center text-[11px] text-warm-gray-300 mt-2">
            Vuốt ngang ⟷ để xem đầy đủ bảng
          </div>
        )}
      </div>

      {/* Modal thêm/sửa tài khoản */}
      {openModal && (
        <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.25px] text-notion-black dark:text-white">{editingId ? 'Sửa tài khoản' : 'Thêm tài khoản'}</h2>
              <button onClick={() => setOpenModal(false)} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Loại tài khoản</label>
                <input required placeholder="VD: Game, Công việc, Mạng xã hội" className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Tài khoản</label>
                <input required placeholder="Tên đăng nhập hoặc email" className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account} onChange={e => setForm({...form, account: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Mật khẩu</label>
                <input required placeholder="Mật khẩu" type="text" className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition font-mono" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <PasswordGenerator onUsePassword={(pwd) => setForm({...form, password: pwd})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Ghi chú</label>
                <textarea placeholder="Thêm ghi chú ở đây..." className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition min-h-[80px] resize-none" value={form.information} onChange={e => setForm({...form, information: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Gmail liên kết</label>
                <input placeholder="Email khôi phục" className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.gmail_link} onChange={e => setForm({...form, gmail_link: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-4 pt-4 sm:pt-6 pb-2 sm:pb-0 border-t border-whisper dark:border-neutral-700 justify-end">
                <button type="button" onClick={() => setOpenModal(false)} className="hidden sm:block px-4 py-[8px] text-[15px] font-medium hover:bg-warm-white dark:hover:bg-neutral-700 text-notion-black dark:text-neutral-200 rounded-[6px] border border-whisper dark:border-neutral-700 transition">Hủy</button>
                <button type="submit" className="w-full sm:w-auto px-5 py-[12px] sm:py-[8px] text-[15px] font-semibold bg-notion-blue hover:bg-notion-blue-hover text-white rounded-[8px] sm:rounded-[6px] transition active:scale-[0.98]">{editingId ? 'Cập nhật' : 'Lưu tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thùng rác */}
      {showTrash && (
        <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[520px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[20px] font-bold text-notion-black dark:text-white">🗑️ Thùng rác</h2>
              <button onClick={() => setShowTrash(false)} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
            </div>
            {trashedAccounts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🗑️</div>
                <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400">Thùng rác trống</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trashedAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 bg-warm-white dark:bg-neutral-800 rounded-[8px] border border-whisper dark:border-neutral-700">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-notion-black dark:text-neutral-100 truncate">{acc.account}</p>
                      <p className="text-[12px] text-warm-gray-300 dark:text-neutral-500">{acc.account_type} • Đã xóa {acc.deleted_at ? timeAgo(acc.deleted_at) : ''}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => handleRestore(acc.id)} className="text-[12px] font-medium text-notion-blue hover:bg-notion-blue/10 px-2.5 py-1.5 rounded-[6px] transition flex items-center gap-1"><RotateCcw size={13}/>Khôi phục</button>
                      <button onClick={() => handlePermanentDelete(acc.id)} className="text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2.5 py-1.5 rounded-[6px] transition">Xóa hẳn</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lịch sử */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[520px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[20px] font-bold text-notion-black dark:text-white">🕐 Lịch sử hoạt động</h2>
              <button onClick={() => setShowActivityLog(false)} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
            </div>
            {activityLogs.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-[14px] text-warm-gray-500 dark:text-neutral-400">Chưa có hoạt động nào</p>
              </div>
            ) : (
              <div className="space-y-0">
                {activityLogs.map((log, i) => (
                  <div key={log.id} className="flex gap-3 py-3 border-b border-whisper dark:border-neutral-700 last:border-b-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] ${log.action === 'create' ? 'bg-emerald-50 dark:bg-emerald-500/10' : log.action === 'delete' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                      {log.action === 'create' ? '➕' : log.action === 'delete' ? '🗑️' : log.action === 'restore' ? '♻️' : log.action === 'pin' || log.action === 'unpin' ? '📌' : '✏️'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-notion-black dark:text-neutral-200"><span className={`font-semibold ${actionColors[log.action] || ''}`}>{actionLabels[log.action] || log.action}</span> {log.details?.account_name && <span className="text-warm-gray-500 dark:text-neutral-400">— {log.details.account_name}</span>}</p>
                      <p className="text-[11px] text-warm-gray-300 dark:text-neutral-500 mt-0.5">{timeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Xuất/Nhập */}
      {showImportExport && (
        <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[420px]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[20px] font-bold text-notion-black dark:text-white">📦 Xuất / Nhập dữ liệu</h2>
              <button onClick={() => setShowImportExport(false)} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px]">Xuất dữ liệu</p>
              <div className="flex gap-2">
                <button onClick={() => handleExport('json')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>JSON</button>
                <button onClick={() => handleExport('csv')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>CSV</button>
              </div>
              <div className="border-t border-whisper dark:border-neutral-700 pt-3">
                <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px] mb-2">Nhập dữ liệu</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-whisper dark:border-neutral-600 rounded-[10px] py-6 cursor-pointer hover:border-notion-blue dark:hover:border-blue-400 hover:bg-notion-blue/5 dark:hover:bg-blue-500/5 transition">
                  <Upload size={20} className="text-warm-gray-300 dark:text-neutral-500 mb-2" />
                  <span className="text-[13px] text-warm-gray-500 dark:text-neutral-400">Chọn file JSON hoặc CSV</span>
                  <input type="file" accept=".json,.csv" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
