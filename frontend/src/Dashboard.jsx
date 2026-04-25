import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Trash2, Plus, Search, Copy, Check, LogOut, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '' });

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

  const handleSave = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/accounts`, form, { headers: { Authorization: `Bearer ${token}` } });
    setOpenModal(false);
    setForm({ account_type: 'Game', account: '', password: '', information: '', gmail_link: '' });
    fetchAccounts();
  };

  // Lọc tài khoản theo từ khóa
  const filtered = accounts.filter(acc =>
    [acc.account_type, acc.account, acc.information, acc.gmail_link]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  );

  // Nhóm theo loại
  const grouped = filtered.reduce((g, acc) => {
    const type = acc.account_type || 'Khác';
    if (!g[type]) g[type] = [];
    g[type].push(acc);
    return g;
  }, {});

  return (
    <div className="w-full min-h-screen bg-notion-white text-notion-black pb-24 overflow-x-hidden">
      {/* Thanh điều hướng */}
      <nav className="flex justify-between items-center h-[54px] px-4 sm:px-6 border-b border-whisper bg-notion-white sticky top-0 z-10">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img src="/logo.png" alt="Account Vault" className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] object-contain" />
          <span className="text-[14px] sm:text-[15px] font-semibold text-notion-black">Account Vault</span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-medium text-warm-gray-500 hover:text-notion-black transition px-3 py-1.5 rounded-[6px] hover:bg-warm-white border border-transparent hover:border-whisper">
          <LogOut size={15} />
          Đăng xuất
        </button>
      </nav>

      {/* Nội dung chính */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-[60px] pt-8 sm:pt-[56px]">
        
        {/* Phần tiêu đề */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-notion-blue" />
              <span className="text-[12px] font-semibold text-notion-blue uppercase tracking-[1px]">Kho lưu trữ</span>
            </div>
            <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-1.5px] leading-tight text-notion-black">
              Tài khoản của tôi
            </h1>
            <p className="text-[14px] sm:text-[15px] text-warm-gray-500 mt-1">
              Quản lý tập trung tất cả tài khoản và mật khẩu.
            </p>
          </div>
          <button onClick={() => setOpenModal(true)} className="w-full sm:w-auto flex justify-center items-center gap-1.5 bg-notion-blue hover:bg-notion-blue-hover text-white px-4 py-[10px] sm:py-[8px] rounded-[8px] sm:rounded-[6px] text-[15px] font-semibold transition active:scale-[0.98] shadow-sm">
            <Plus size={16}/>Thêm mới
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-300" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            className="w-full bg-warm-white border border-whisper rounded-[8px] pl-9 pr-4 py-[9px] text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-warm-gray-300">
              {filtered.length} kết quả
            </span>
          )}
        </div>

        {/* Bảng dữ liệu — nhóm theo loại */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 border border-whisper rounded-[12px] bg-warm-white/50">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-[15px] text-warm-gray-500 font-medium">Chưa có tài khoản nào</p>
            <p className="text-[13px] text-warm-gray-300 mt-1">Bấm "Thêm mới" để bắt đầu lưu trữ.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-6">
              {/* Tiêu đề nhóm */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2 py-[3px] bg-badge-bg text-badge-text rounded-full text-[11px] font-bold tracking-[0.5px] uppercase">
                  {type}
                </span>
                <span className="text-[12px] text-warm-gray-300">{items.length} tài khoản</span>
              </div>

              {/* Bảng */}
              <div className="w-full bg-notion-white border border-whisper rounded-[10px] shadow-whisper overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[650px] text-left text-[14px] border-collapse">
                    <thead className="bg-[#fafaf9] text-warm-gray-500 text-[12px] uppercase tracking-[0.5px]">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold border-b border-whisper">Tài khoản</th>
                        <th className="px-4 py-2.5 font-semibold border-b border-whisper w-[200px]">Mật khẩu</th>
                        <th className="px-4 py-2.5 font-semibold border-b border-whisper">Ghi chú</th>
                        <th className="px-4 py-2.5 font-semibold border-b border-whisper">Gmail liên kết</th>
                        <th className="px-4 py-2.5 font-semibold border-b border-whisper w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(acc => (
                        <tr key={acc.id} className="hover:bg-warm-white/60 transition group align-top border-b border-whisper last:border-b-0">
                          <td className="px-4 py-3 font-medium text-[14px] text-notion-black whitespace-normal break-words min-w-[120px]">
                            {acc.account}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[13px] text-warm-gray-500 bg-warm-white px-1.5 py-[2px] rounded-[4px] min-w-[80px]">
                                {showPwd[acc.id] ? acc.password : '••••••••'}
                              </span>
                              <button onClick={() => togglePwd(acc.id)} className="text-warm-gray-300 hover:text-warm-gray-500 transition p-1 rounded-[4px] hover:bg-warm-white" title={showPwd[acc.id] ? 'Ẩn' : 'Hiện'}>
                                {showPwd[acc.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                              </button>
                              <button onClick={() => handleCopy(acc.password, acc.id)} className="text-warm-gray-300 hover:text-notion-blue transition p-1 rounded-[4px] hover:bg-warm-white" title="Sao chép">
                                {copied === acc.id ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-warm-gray-500 max-w-[200px] truncate text-[13px]" title={acc.information}>
                            {acc.information || '—'}
                          </td>
                          <td className="px-4 py-3 text-warm-gray-500 max-w-[180px] truncate text-[13px]">
                            {acc.gmail_link ? (
                              <span className="hover:text-notion-blue hover:underline cursor-pointer">{acc.gmail_link}</span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button onClick={() => handleDelete(acc.id)} className="text-warm-gray-300 sm:opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition p-1.5 rounded-[6px]" title="Xóa">
                              <Trash2 size={15}/>
                            </button>
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

      {/* Modal thêm mới — phong cách Notion */}
      {openModal && (
        <div className="fixed inset-0 bg-warm-dark/40 sm:bg-warm-dark/20 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white border-t sm:border border-whisper rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.25px] text-notion-black">Thêm tài khoản</h2>
              <button onClick={() => setOpenModal(false)} className="sm:hidden w-8 h-8 flex items-center justify-center bg-warm-white rounded-full text-warm-gray-500 text-[18px]">&times;</button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[4px]">Loại tài khoản</label>
                <input required placeholder="VD: Game, Công việc, Mạng xã hội" className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[4px]">Tài khoản</label>
                <input required placeholder="Tên đăng nhập hoặc email" className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account} onChange={e => setForm({...form, account: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[4px]">Mật khẩu</label>
                <input required placeholder="Mật khẩu" type="text" className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition font-mono" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[4px]">Ghi chú</label>
                <textarea placeholder="Thêm ghi chú ở đây..." className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition min-h-[80px] resize-none" value={form.information} onChange={e => setForm({...form, information: e.target.value})} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-warm-gray-500 mb-[4px]">Gmail liên kết</label>
                <input placeholder="Email khôi phục" className="w-full bg-notion-white border border-whisper rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.gmail_link} onChange={e => setForm({...form, gmail_link: e.target.value})} />
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 sm:pt-6 pb-2 sm:pb-0 border-t border-whisper justify-end">
                <button type="button" onClick={() => setOpenModal(false)} className="hidden sm:block px-4 py-[8px] text-[15px] font-medium hover:bg-warm-white text-notion-black rounded-[6px] border border-whisper transition">Hủy</button>
                <button type="submit" className="w-full sm:w-auto px-5 py-[12px] sm:py-[8px] text-[15px] font-semibold bg-notion-blue hover:bg-notion-blue-hover text-white rounded-[8px] sm:rounded-[6px] transition active:scale-[0.98]">Lưu tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
