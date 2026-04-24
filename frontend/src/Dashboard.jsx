import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Trash2, Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [showPwd, setShowPwd] = useState({});
  const [openModal, setOpenModal] = useState(false);
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

  const handleDelete = async (id) => {
    if(!confirm('Delete this account block?')) return;
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

  return (
    <div className="w-full min-h-screen bg-notion-white text-notion-black pb-24 overflow-x-hidden">
      {/* Top Nav (Notion minimalist nav) */}
      <nav className="flex justify-between items-center h-[54px] px-4 sm:px-6 border-b whisper-border bg-notion-white sticky top-0 z-10 transition-shadow duration-300">
        <div className="flex items-center gap-2 cursor-pointer">
           <svg viewBox="0 0 100 100" className="w-[28px] h-[28px] sm:w-[33px] sm:h-[34px] text-notion-black"><path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="currentColor"/></svg>
           <span className="text-[14px] sm:text-[15px] font-semibold text-notion-black">Account Vault</span>
        </div>
        <button onClick={onLogout} className="text-[13px] sm:text-[14px] font-medium text-warm-gray-500 hover:text-notion-black transition px-2 py-1 rounded-[4px] hover:bg-warm-white bg-warm-white sm:bg-transparent border whisper-border sm:border-transparent">
            Log out
        </button>
      </nav>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-[60px] pt-8 sm:pt-[80px]">
        {/* Header Block - Xử lý Reponsive Điện thoại hiển thị theo hàng dọc */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-[32px] sm:text-[48px] font-bold tracking-[-1.5px] leading-tight mb-2 text-notion-black">
                Vault
              </h1>
              <p className="text-[14px] sm:text-[16px] text-warm-gray-500">
                A central workspace for credentials and recovery links.
              </p>
            </div>
            {/* Nút thêm mới - Trên đt là block dài 100% */}
            <button onClick={() => setOpenModal(true)} className="w-full sm:w-auto flex justify-center items-center gap-1 bg-notion-blue hover:bg-notion-blue-hover text-white px-3 py-[10px] sm:py-[6px] rounded-[6px] sm:rounded-[4px] text-[15px] font-semibold transition active:scale-[0.98] shadow-sm">
              <Plus size={16}/> New Account
            </button>
        </div>

        {/* Data Table - Quét ngang trên điện thoại */}
        <div className="w-full bg-notion-white border whisper-border rounded-[8px] shadow-whisper relative">
          <div className="overflow-x-auto w-full pb-1">
            <table className="w-full min-w-[700px] text-left text-[14px] border-collapse whitespace-nowrap">
              <thead className="bg-[#fcfaf9] text-warm-gray-500 border-b whisper-border">
                <tr>
                  <th className="px-3 py-2 font-medium border-r whisper-border w-[120px] border-b">Account_type</th>
                  <th className="px-3 py-2 font-medium border-r whisper-border border-b">Account</th>
                  <th className="px-3 py-2 font-medium border-r whisper-border w-[180px] border-b">PassWord</th>
                  <th className="px-3 py-2 font-medium border-r whisper-border border-b">Information</th>
                  <th className="px-3 py-2 font-medium border-r whisper-border border-b">gmailLink</th>
                  <th className="px-3 py-2 font-medium w-12 border-b"></th>
                </tr>
              </thead>
              <tbody className="divide-y whisper-border">
                {accounts.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-warm-gray-300">No database blocks found.</td></tr>
                )}
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-warm-white/60 transition group text-[14px] sm:text-[15px] text-notion-black align-top">
                    <td className="px-3 py-3 border-r whisper-border">
                      <span className="inline-block px-[6px] py-[2px] bg-badge-bg text-badge-text rounded-full text-[11px] sm:text-[12px] font-semibold tracking-[0.125px]">
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r whisper-border font-medium whitespace-normal break-words sm:whitespace-nowrap min-w-[120px]">{acc.account}</td>
                    <td className="px-3 py-3 border-r whisper-border">
                      <div className="flex items-center justify-between gap-1 w-full max-w-[180px]">
                        <span className="font-mono text-[13px] sm:text-[14px] text-warm-gray-500 overflow-hidden text-ellipsis bg-warm-white px-1 py-[2px] rounded-[3px]">
                          {showPwd[acc.id] ? acc.password : '••••••••'}
                        </span>
                        <button onClick={() => togglePwd(acc.id)} className="text-warm-gray-300 hover:text-warm-gray-500 transition p-[2px]">
                          {showPwd[acc.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r whisper-border text-warm-gray-500 max-w-[200px] truncate" title={acc.information}>{acc.information || '-'}</td>
                    <td className="px-3 py-3 border-r whisper-border text-warm-gray-500 hover:text-notion-blue hover:underline cursor-pointer truncate max-w-[150px] sm:max-w-[200px]">{acc.gmail_link || '-'}</td>
                    <td className="px-2 py-3 text-center">
                      <button onClick={() => handleDelete(acc.id)} className="text-warm-gray-300 sm:opacity-0 group-hover:opacity-100 hover:bg-warm-white hover:text-red-500 transition p-1 rounded-[4px]"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Gợi ý điện thoại (chỉ hiện trên màn nhỏ) */}
          <div className="block sm:hidden text-center text-[11px] text-warm-gray-300 pt-2 pb-3">
             Vuốt ngang ⟷ để xem bảng
          </div>
        </div>
      </div>

      {/* Notion style Modal Backdrop - Điện thoại trượt từ dưới lên */}
      {openModal && (
        <div className="fixed inset-0 bg-warm-dark/40 sm:bg-warm-dark/20 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-notion-white border-t sm:border whisper-border rounded-t-[16px] sm:rounded-t-[12px] sm:rounded-b-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[480px] animate-in slide-in-from-bottom-24 sm:zoom-in-[0.98] duration-300 ease-out max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.25px] text-notion-black">Create a block</h2>
               <button onClick={() => setOpenModal(false)} className="sm:hidden w-8 h-8 flex items-center justify-center bg-warm-white rounded-full text-warm-gray-500 text-[18px]">&times;</button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[14px] font-medium text-warm-gray-500 mb-[4px]">Account_type</label>
                <input required placeholder="E.g., Game, Work" className="w-full bg-notion-white border whisper-border rounded-[6px] sm:rounded-[4px] px-3 py-[10px] sm:py-[6px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-warm-gray-500 mb-[4px]">Account</label>
                <input required placeholder="Username or Email" className="w-full bg-notion-white border whisper-border rounded-[6px] sm:rounded-[4px] px-3 py-[10px] sm:py-[6px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.account} onChange={e => setForm({...form, account: e.target.value})} />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-warm-gray-500 mb-[4px]">PassWord</label>
                <input required placeholder="Secret" type="text" className="w-full bg-notion-white border whisper-border rounded-[6px] sm:rounded-[4px] px-3 py-[10px] sm:py-[6px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition font-mono" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
               <div>
                <label className="block text-[14px] font-medium text-warm-gray-500 mb-[4px]">Information</label>
                <textarea placeholder="Add notes here..." className="w-full bg-notion-white border whisper-border rounded-[6px] sm:rounded-[4px] px-3 py-[10px] sm:py-[6px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition min-h-[80px]" value={form.information} onChange={e => setForm({...form, information: e.target.value})} />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-warm-gray-500 mb-[4px]">gmailLink</label>
                <input placeholder="Recovery email" className="w-full bg-notion-white border whisper-border rounded-[6px] sm:rounded-[4px] px-3 py-[10px] sm:py-[6px] text-[15px] focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition" value={form.gmail_link} onChange={e => setForm({...form, gmail_link: e.target.value})} />
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 sm:pt-6 pb-2 sm:pb-0 border-t whisper-border justify-end">
                <button type="button" onClick={() => setOpenModal(false)} className="hidden sm:block px-4 py-[6px] text-[15px] font-medium hover:bg-warm-white text-notion-black rounded-[4px] border border-transparent hover:whisper-border transition">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-4 py-[12px] sm:py-[6px] text-[15px] sm:font-semibold bg-notion-blue hover:bg-notion-blue-hover text-white rounded-[6px] sm:rounded-[4px] transition active:scale-[0.98]">Save block</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
