import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Loader2, Plus, RefreshCw, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const getAuthHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` });

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDateLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return 'Hôm nay';
  if (sameDay(date, yesterday)) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

function PhotoTile({ photo, onOpen }) {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/drive/images/${photo.id}`, { headers: getAuthHeaders(), responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      } catch {
        setSrc('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.id]);

  return (
    <button type="button" onClick={() => src && onOpen({ ...photo, src })} className="relative aspect-square overflow-hidden rounded-2xl border border-whisper bg-warm-white shadow-sm dark:border-neutral-800 dark:bg-neutral-800">
      {loading ? <Loader2 size={20} className="m-auto mt-[42%] animate-spin text-warm-gray-300" /> : src ? <img src={src} alt={photo.name} className="h-full w-full object-cover" /> : <ImageIcon size={24} className="m-auto mt-[42%] text-warm-gray-300" />}
    </button>
  );
}

export default function DriveImageManager({ onOpenSettings }) {
  const inputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const loadPhotos = async ({ append = false, pageToken = null } = {}) => {
    setLoading(!append);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/drive/images`, {
        headers: getAuthHeaders(),
        params: { limit: 100, pageToken: pageToken || undefined },
      });
      setPhotos(prev => append ? [...prev, ...(res.data.images || [])] : (res.data.images || []));
      setNextPageToken(res.data.nextPageToken || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Không tải được thư viện ảnh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPhotos(); }, []);

  const groupedPhotos = useMemo(() => photos.reduce((groups, photo) => {
    const label = formatDateLabel(photo.createdTime || photo.modifiedTime);
    if (!groups[label]) groups[label] = [];
    groups[label].push(photo);
    return groups;
  }, {}), [photos]);

  const uploadPhotos = async (files) => {
    const selected = Array.from(files || []);
    if (selected.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of selected) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} không phải file ảnh.`);
        if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} vượt quá giới hạn 8MB.`);
        const data = await fileToBase64(file);
        await axios.post(`${API_URL}/api/drive/images`, { name: file.name, mimeType: file.type, data }, { headers: getAuthHeaders() });
      }
      await loadPhotos();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Không upload được ảnh.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-notion-black dark:text-white">Quản lý ảnh</h1>
          <p className="text-warm-gray-500 dark:text-neutral-400">Ảnh được lưu trong Google Drive của bạn và phân nhóm theo ngày.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => loadPhotos()} disabled={loading || uploading} className="flex items-center gap-2 rounded-xl border border-whisper bg-white px-4 py-2.5 text-[13px] font-bold text-warm-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-xl bg-notion-blue px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Thêm ảnh
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => uploadPhotos(e.target.files)} />
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-bold">{error}</p>
          {error.includes('chưa kết nối') && <button type="button" onClick={onOpenSettings} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-[12px] font-bold text-white">Mở cài đặt Drive</button>}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-whisper bg-white dark:border-neutral-800 dark:bg-neutral-800/50"><Loader2 size={28} className="animate-spin text-warm-gray-300" /></div>
      ) : photos.length === 0 && !error ? (
        <div className="rounded-3xl border-2 border-dashed border-whisper bg-white py-24 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
          <ImageIcon size={52} className="mx-auto mb-4 text-warm-gray-100 dark:text-neutral-600" />
          <p className="font-bold text-notion-black dark:text-white">Chưa có ảnh nào.</p>
          <p className="mt-1 text-[14px] text-warm-gray-400">Bấm “Thêm ảnh” để upload vào Google Drive.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedPhotos).map(([dateLabel, items]) => (
            <section key={dateLabel}>
              <div className="mb-4 flex items-center justify-between px-1">
                <h2 className="text-[15px] font-bold text-notion-black dark:text-white">{dateLabel}</h2>
                <span className="text-[12px] font-semibold text-warm-gray-400">{items.length} ảnh</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map(photo => <PhotoTile key={photo.id} photo={photo} onOpen={setSelectedPhoto} />)}
              </div>
            </section>
          ))}
          {nextPageToken && <div className="flex justify-center"><button type="button" onClick={() => loadPhotos({ append: true, pageToken: nextPageToken })} className="rounded-xl border border-whisper bg-white px-5 py-2.5 text-[13px] font-bold text-warm-gray-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">Tải thêm</button></div>}
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4 text-white">
          <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20"><X size={22} /></button>
          <img src={selectedPhoto.src} alt={selectedPhoto.name} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
