import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const actionMeta = {
  all: { label: 'Tất cả' },
  create: { label: 'Tạo mới', icon: Plus, tone: 'emerald' },
  update: { label: 'Cập nhật', icon: Edit2, tone: 'blue' },
  delete: { label: 'Xóa', icon: Trash2, tone: 'red' },
  restore: { label: 'Khôi phục', icon: RotateCcw, tone: 'amber' },
};

const fieldLabels = {
  account_type: 'Loại tài khoản',
  account: 'Tài khoản',
  password: 'Mật khẩu',
  information: 'Ghi chú',
  gmail_link: 'Gmail liên kết',
  tags: 'Thẻ',
};

const toneClasses = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  blue: 'bg-blue-50 text-notion-blue dark:bg-blue-500/10 dark:text-blue-400',
  red: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function timeAgo(value, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  return `${Math.floor(seconds / 86400)} ngày trước`;
}

function formatValue(field, value) {
  if (field === 'password') return '••••••••';
  if (field === 'tags') {
    const tags = Array.isArray(value) ? value : [];
    return tags.length ? tags.map(tag => `#${tag}`).join(', ') : '(trống)';
  }
  return value || '(trống)';
}

export default function ActivityLogModal({
  token,
  inline = false,
  onClose,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [now] = useState(() => Date.now());

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_URL}/api/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : 'Không thể tải lịch sử hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    axios.get(`${API_URL}/api/activity-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!cancelled) setLogs(res.data);
    }).catch(err => {
      if (!cancelled) {
        setError(err.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : 'Không thể tải lịch sử hoạt động.');
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return logs.filter(log => {
      const accountName = log.details?.account_name || '';
      const matchesSearch = !keyword || accountName.toLowerCase().includes(keyword);
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce((groups, log) => {
      const label = dayLabel(log.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(log);
      return groups;
    }, {});
  }, [filteredLogs]);

  const renderChangeDetails = (log) => {
    const changes = log.details?.changes;
    if (log.action !== 'update' || !changes) return null;

    const entries = Object.entries(changes);
    if (entries.length === 0) return null;

    return (
      <div className="mt-3 max-w-full overflow-hidden rounded-[8px] border border-whisper bg-warm-white/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="hidden grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-whisper pb-2 text-[11px] font-bold uppercase tracking-wide text-warm-gray-400 dark:border-neutral-800 lg:grid">
          <span>Trường</span>
          <span>Trước</span>
          <span>Sau</span>
        </div>
        <div className="divide-y divide-whisper dark:divide-neutral-800">
          {entries.map(([field, value]) => (
            <div key={field} className="grid min-w-0 gap-2 py-3 text-[12px] lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-3 lg:py-2">
              <span className="min-w-0 font-semibold text-warm-gray-500 dark:text-neutral-400">{fieldLabels[field] || field}</span>
              <div className="min-w-0 rounded-[6px] bg-white px-2 py-1 dark:bg-neutral-950/40 lg:bg-transparent lg:px-0 lg:py-0 lg:dark:bg-transparent">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-warm-gray-300 lg:hidden">Trước</span>
                <span className="block min-w-0 break-words text-red-500 line-through opacity-80 lg:truncate" title={formatValue(field, value.old)}>
                  {formatValue(field, value.old)}
                </span>
              </div>
              <div className="min-w-0 rounded-[6px] bg-white px-2 py-1 dark:bg-neutral-950/40 lg:bg-transparent lg:px-0 lg:py-0 lg:dark:bg-transparent">
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-warm-gray-300 lg:hidden">Sau</span>
                <span className="block min-w-0 break-words font-semibold text-emerald-600 dark:text-emerald-400 lg:truncate" title={formatValue(field, value.new)}>
                  {formatValue(field, value.new)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLog = (log) => {
    const meta = actionMeta[log.action] || actionMeta.update;
    const Icon = meta.icon || Edit2;
    const changesCount = log.details?.changes ? Object.keys(log.details.changes).length : 0;
    const canExpand = log.action === 'update' && changesCount > 0;

    return (
      <div key={log.id} className="relative flex max-w-full gap-3 border-b border-whisper py-4 last:border-b-0 dark:border-neutral-800 sm:gap-4">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-10 sm:w-10 ${toneClasses[meta.tone] || toneClasses.blue}`}>
          <Icon size={17} />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-notion-black dark:text-white">{meta.label}</span>
                {canExpand && (
                  <span className="rounded-full bg-notion-blue/10 px-2 py-0.5 text-[11px] font-semibold text-notion-blue dark:bg-blue-500/10 dark:text-blue-400">
                    {changesCount} thay đổi
                  </span>
                )}
              </div>
              <p className="mt-1 min-w-0 break-words text-[13px] text-warm-gray-500 dark:text-neutral-400 sm:truncate">
                {log.details?.account_name ? (
                  <>Tài khoản <strong className="text-notion-black dark:text-neutral-200">{log.details.account_name}</strong></>
                ) : log.details?.bulk ? (
                  <>Nhập hàng loạt {log.details.count || 0} tài khoản</>
                ) : (
                  'Thay đổi hệ thống'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-warm-gray-300 dark:text-neutral-500 sm:flex-shrink-0">
              <span title={formatDateTime(log.created_at)}>{timeAgo(log.created_at, now)}</span>
              {canExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                  className="flex items-center gap-1 rounded-[6px] px-2 py-1 font-semibold text-warm-gray-500 transition hover:bg-warm-white hover:text-notion-blue dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Chi tiết
                  <ChevronDown size={14} className={`transition-transform ${expanded[log.id] ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {expanded[log.id] && renderChangeDetails(log)}
        </div>
      </div>
    );
  };

  const content = (
    <div className={inline ? 'max-w-full overflow-hidden' : 'max-h-[80vh] max-w-full overflow-y-auto overflow-x-hidden'}>
      {!inline && (
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-notion-blue" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Lịch sử hoạt động</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-white text-warm-gray-500 dark:bg-neutral-700 dark:text-neutral-300">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên tài khoản..."
            className="w-full rounded-[8px] border border-whisper bg-white py-2.5 pl-9 pr-3 text-[14px] text-notion-black outline-none transition focus:border-notion-blue focus:ring-2 focus:ring-notion-blue/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {Object.entries(actionMeta).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActionFilter(key)}
              className={`flex-shrink-0 rounded-[8px] border px-3 py-2 text-[12px] font-bold transition ${
                actionFilter === key
                  ? 'border-notion-blue bg-notion-blue text-white'
                  : 'border-whisper bg-white text-warm-gray-500 hover:text-notion-blue dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {meta.label}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchLogs}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-[8px] border border-whisper bg-white px-3 py-2 text-[12px] font-bold text-warm-gray-500 transition hover:text-notion-blue dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><RefreshCw className="animate-spin text-notion-blue" /></div>
      ) : error ? (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-4 text-[14px] font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-whisper py-14 text-center dark:border-neutral-700">
          <Clock size={44} className="mx-auto mb-3 text-warm-gray-300" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-warm-gray-400">Không có hoạt động phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([label, items]) => (
            <section key={label}>
              <h3 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-warm-gray-400">{label}</h3>
              <div className="max-w-full overflow-hidden rounded-[10px] border border-whisper bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900/30 sm:px-4">
                {items.map(renderLog)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <Motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
      >
        {content}
      </Motion.div>
    </Motion.div>
  );
}
