import React, { useMemo, useState } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import PasswordGenerator, { getStrength } from '../PasswordGenerator';
import PasswordInput from './PasswordInput';

const uniqueValues = (values) => {
  const seen = new Set();
  return values.reduce((result, value) => {
    const trimmed = String(value || '').trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return result;
    seen.add(key);
    result.push(trimmed);
    return result;
  }, []);
};

export default function AddEditModal({
  editingId,
  form,
  setForm,
  onSave,
  onClose,
  accounts = [],
  saveError = '',
  isSaving = false
}) {
  const [tagInput, setTagInput] = useState('');
  const [isTypeFocused, setIsTypeFocused] = useState(false);
  const [isTagFocused, setIsTagFocused] = useState(false);
  const strength = getStrength(form.password || '');

  const accountTypeSuggestions = useMemo(() => {
    const query = (form.account_type || '').trim().toLowerCase();
    return uniqueValues(accounts.slice().reverse().map(acc => acc.account_type))
      .filter(type => type.toLowerCase().includes(query) && type !== form.account_type)
      .slice(0, 8);
  }, [accounts, form.account_type]);

  const tagQuery = tagInput.split(',').pop().trim().toLowerCase();
  const tagSuggestions = useMemo(() => {
    const selectedTags = new Set((form.tags || []).map(tag => tag.toLowerCase()));
    return uniqueValues(accounts.slice().reverse().flatMap(acc => acc.tags || []))
      .filter(tag => !selectedTags.has(tag.toLowerCase()))
      .filter(tag => !tagQuery || tag.toLowerCase().includes(tagQuery))
      .slice(0, 8);
  }, [accounts, form.tags, tagQuery]);

  const buildTags = (rawTags, rawInput) => {
    const existing = rawTags || [];
    const pendingTags = rawInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    return Array.from(new Set([...existing, ...pendingTags]));
  };

  const commitTagInput = () => {
    if (!tagInput.trim()) return form.tags || [];

    const nextTags = buildTags(form.tags, tagInput);
    setForm({ ...form, tags: nextTags });
    setTagInput('');
    return nextTags;
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTagInput();
    }
  };

  const removeTag = (tagToRemove) => {
    setForm({ ...form, tags: (form.tags || []).filter(t => t !== tagToRemove) });
  };

  const selectSuggestedTag = (tag) => {
    const pendingTags = tagInput
      .split(',')
      .slice(0, -1)
      .map(item => item.trim())
      .filter(Boolean);
    const nextTags = Array.from(new Set([...(form.tags || []), ...pendingTags, tag]));
    setForm({ ...form, tags: nextTags });
    setTagInput('');
    setIsTagFocused(false);
  };

  const handleSubmit = (e) => {
    const tags = tagInput.trim() ? buildTags(form.tags, tagInput) : (form.tags || []);
    setTagInput('');
    onSave(e, { ...form, tags });
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
      <Motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.25px] text-notion-black dark:text-white">{editingId ? 'Sửa tài khoản' : 'Thêm tài khoản'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" aria-busy={isSaving} className="flex flex-col gap-[14px]">
          <input type="text" name="username" autoComplete="username" className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden="true" />
          <input type="password" name="password" autoComplete="current-password" className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} aria-hidden="true" />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Loại tài khoản</label>
              <div className="relative">
              <input
                required
                autoComplete="off"
                name="stored-category"
                placeholder="VD: Game, Công việc"
                className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition"
                value={form.account_type}
                onFocus={() => setIsTypeFocused(true)}
                onBlur={() => setTimeout(() => setIsTypeFocused(false), 120)}
                onChange={e => setForm({ ...form, account_type: e.target.value })}
              />
              {isTypeFocused && accountTypeSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[8px] border border-whisper dark:border-neutral-700 bg-notion-white dark:bg-neutral-800 shadow-deep">
                  {accountTypeSuggestions.map(type => (
                    <button
                      key={type}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, account_type: type });
                        setIsTypeFocused(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-[14px] font-medium text-notion-black dark:text-neutral-100 hover:bg-warm-white dark:hover:bg-neutral-700"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Thẻ (Tags)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags || []).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-notion-blue/10 text-notion-blue dark:bg-blue-500/20 dark:text-blue-400 rounded-full text-[12px] font-medium">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="relative">
              <TagIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-300" />
              <input
                autoComplete="off"
                name="stored-tags"
                placeholder="Nhập tag, nhấn Enter hoặc dùng dấu phẩy..."
                className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] pl-9 pr-3 py-[10px] sm:py-[8px] text-[14px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 transition"
                value={tagInput}
                onFocus={() => setIsTagFocused(true)}
                onBlur={() => setTimeout(() => setIsTagFocused(false), 120)}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {isTagFocused && tagSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[8px] border border-whisper dark:border-neutral-700 bg-notion-white dark:bg-neutral-800 shadow-deep">
                  {tagSuggestions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestedTag(tag)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] font-medium text-notion-black dark:text-neutral-100 hover:bg-warm-white dark:hover:bg-neutral-700"
                    >
                      <TagIcon size={13} className="text-warm-gray-300" />
                      <span className="truncate">{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Tài khoản</label>
            <input
              required
              autoComplete="off"
              name="stored-login"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Tên đăng nhập hoặc email"
              className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition"
              value={form.account}
              onChange={e => setForm({ ...form, account: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Mật khẩu</label>
            <PasswordInput
              required
              autoComplete="off"
              name="stored-secret"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Mật khẩu"
              className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition font-mono"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-warm-white dark:bg-neutral-700'}`} />
                ))}
              </div>
              <span className={`text-[11px] font-bold min-w-[70px] text-right ${strength.text}`}>{strength.label}</span>
            </div>

            <PasswordGenerator onUsePassword={(pwd) => setForm({ ...form, password: pwd })} />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Ghi chú</label>
            <textarea
              autoComplete="off"
              name="stored-note"
              placeholder="Thêm ghi chú ở đây..."
              className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition min-h-[80px] resize-none"
              value={form.information}
              onChange={e => setForm({ ...form, information: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-[4px]">Gmail liên kết</label>
            <input
              autoComplete="off"
              name="stored-recovery"
              placeholder="Email khôi phục"
              className="w-full bg-notion-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[10px] sm:py-[8px] text-[15px] text-notion-black dark:text-neutral-100 focus:outline-none focus:ring-[2px] focus:ring-notion-blue/50 focus:border-notion-blue transition"
              value={form.gmail_link}
              onChange={e => setForm({ ...form, gmail_link: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-3 mt-4 pt-4 sm:pt-6 pb-2 sm:pb-0 border-t border-whisper dark:border-neutral-700">
            {saveError && (
              <p className="text-[13px] font-medium text-red-500 dark:text-red-400">
                {saveError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="hidden sm:block px-4 py-[8px] text-[15px] font-medium hover:bg-warm-white dark:hover:bg-neutral-700 text-notion-black dark:text-neutral-200 rounded-[6px] border border-whisper dark:border-neutral-700 transition">Hủy</button>
            <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-5 py-[12px] sm:py-[8px] text-[15px] font-semibold bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-[8px] sm:rounded-[6px] transition active:scale-[0.98]">{isSaving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu tài khoản'}</button>
          </div>
          </div>
        </form>
      </Motion.div>
    </Motion.div>
  );
}
