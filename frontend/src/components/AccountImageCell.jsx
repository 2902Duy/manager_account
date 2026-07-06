import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Loader2, UploadCloud, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
});

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function AccountImageCell({ account, compact = false }) {
  const inputRef = useRef(null);
  const [hasImage, setHasImage] = useState(Boolean(account.image_drive_file_id));
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasImage(Boolean(account.image_drive_file_id));
  }, [account.image_drive_file_id]);

  useEffect(() => {
    let objectUrl = '';
    const token = sessionStorage.getItem('token');

    const loadImage = async () => {
      if (!hasImage || !token || token === 'local-dev-token') {
        setSrc('');
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/accounts/${account.id}/image`, {
          headers: getAuthHeaders(),
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      } catch {
        setSrc('');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [account.id, hasImage]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Chỉ hỗ trợ file ảnh.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Ảnh vượt quá giới hạn 8MB.');
      return;
    }

    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      await axios.post(`${API_URL}/api/accounts/${account.id}/image`, {
        name: file.name,
        mimeType: file.type,
        data: base64,
      }, { headers: getAuthHeaders() });
      setHasImage(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Không upload được ảnh. Hãy kiểm tra Google Drive đã kết nối chưa.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!hasImage) return;
    if (!confirm('Xóa ảnh này khỏi Google Drive?')) return;

    setBusy(true);
    try {
      await axios.delete(`${API_URL}/api/accounts/${account.id}/image`, { headers: getAuthHeaders() });
      setHasImage(false);
      setSrc('');
    } catch (err) {
      alert(err.response?.data?.error || 'Không xóa được ảnh.');
    } finally {
      setBusy(false);
    }
  };

  const sizeClass = compact ? 'w-10 h-10' : 'w-11 h-11';

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} rounded-xl overflow-hidden border border-whisper dark:border-neutral-700 bg-warm-white dark:bg-neutral-800 flex items-center justify-center shrink-0`}>
        {loading ? (
          <Loader2 size={16} className="animate-spin text-warm-gray-300" />
        ) : src ? (
          <img src={src} alt="Account" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={compact ? 16 : 18} className="text-warm-gray-300 dark:text-neutral-500" />
        )}
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="p-1 rounded-md text-warm-gray-400 hover:text-notion-blue hover:bg-notion-blue/10 transition disabled:opacity-50"
          title={hasImage ? 'Đổi ảnh' : 'Upload ảnh'}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        </button>
        {hasImage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="p-1 rounded-md text-warm-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50"
            title="Xóa ảnh"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleUpload(e.target.files?.[0])}
      />
    </div>
  );
}
