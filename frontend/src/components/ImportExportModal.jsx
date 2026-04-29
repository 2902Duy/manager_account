import React from 'react';
import { Package, X, Download, Upload } from 'lucide-react';

export default function ImportExportModal({ 
  onClose, 
  onExport, 
  onImport 
}) {
  return (
    <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[420px]">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-amber-500" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Xuất / Nhập dữ liệu</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
        </div>
        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px]">Xuất dữ liệu</p>
          <div className="flex gap-2">
            <button onClick={() => onExport('json')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>JSON</button>
            <button onClick={() => onExport('csv')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>CSV</button>
          </div>
          <div className="border-t border-whisper dark:border-neutral-700 pt-3">
            <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px] mb-2">Nhập dữ liệu</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-whisper dark:border-neutral-600 rounded-[10px] py-6 cursor-pointer hover:border-notion-blue dark:hover:border-blue-400 hover:bg-notion-blue/5 dark:hover:bg-blue-500/5 transition">
              <Upload size={20} className="text-warm-gray-300 dark:text-neutral-500 mb-2" />
              <span className="text-[13px] text-warm-gray-500 dark:text-neutral-400">Chọn file JSON hoặc CSV</span>
              <input type="file" accept=".json,.csv" onChange={onImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
