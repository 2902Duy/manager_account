import React, { useState } from 'react';
import { Package, X, Download, Upload, LockKeyhole } from 'lucide-react';
import PasswordInput from './PasswordInput';

export default function ImportExportModal({
  onClose,
  onExport,
  onImport
}) {
  const [mode, setMode] = useState(null);
  const [format, setFormat] = useState('json');
  const [file, setFile] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const resetPassphrase = () => {
    setMode(null);
    setFile(null);
    setPassphrase('');
    setError('');
    setIsWorking(false);
  };

  const beginExport = (nextFormat) => {
    setFormat(nextFormat);
    setMode('export');
    setFile(null);
    setPassphrase('');
    setError('');
  };

  const beginImport = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;
    setFile(selectedFile);
    setMode('import');
    setPassphrase('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!passphrase.trim()) {
      setError('Enter a passphrase.');
      return;
    }

    setIsWorking(true);
    try {
      if (mode === 'export') {
        await onExport(format, passphrase);
      } else {
        await onImport(file, passphrase);
      }
      resetPassphrase();
    } catch (err) {
      setError(err.message || 'Could not complete this action.');
      setIsWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-warm-dark/40 dark:bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-notion-white dark:bg-[#252525] border-t sm:border border-whisper dark:border-neutral-700 rounded-t-[16px] sm:rounded-[12px] shadow-deep p-6 sm:p-8 w-full max-w-[440px]">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-amber-500" />
            <h2 className="text-[20px] font-bold text-notion-black dark:text-white">Encrypted import/export</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-warm-white dark:bg-neutral-700 rounded-full text-warm-gray-500 dark:text-neutral-300"><X size={16}/></button>
        </div>

        {!mode ? (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px]">Export</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => beginExport('json')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>JSON</button>
                <button onClick={() => beginExport('csv')} className="flex-1 flex items-center justify-center gap-1.5 border border-whisper dark:border-neutral-700 rounded-[8px] py-3 text-[14px] font-medium text-notion-black dark:text-neutral-200 hover:bg-warm-white dark:hover:bg-neutral-800 transition"><Download size={14}/>CSV</button>
              </div>
              <p className="mt-2 text-[12px] text-warm-gray-400 dark:text-neutral-500">
                Export files are encrypted with a passphrase before download.
              </p>
            </div>

            <div className="border-t border-whisper dark:border-neutral-700 pt-4">
              <p className="text-[13px] font-semibold text-warm-gray-500 dark:text-neutral-400 uppercase tracking-[0.5px] mb-2">Import</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-whisper dark:border-neutral-600 rounded-[10px] py-6 cursor-pointer hover:border-notion-blue dark:hover:border-blue-400 hover:bg-notion-blue/5 dark:hover:bg-blue-500/5 transition">
                <Upload size={20} className="text-warm-gray-300 dark:text-neutral-500 mb-2" />
                <span className="text-[13px] text-warm-gray-500 dark:text-neutral-400">Choose encrypted DLock JSON</span>
                <input type="file" accept=".json" onChange={beginImport} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3 rounded-[10px] border border-whisper bg-warm-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[8px] bg-notion-blue/10 text-notion-blue dark:bg-blue-500/10 dark:text-blue-400">
                <LockKeyhole size={17} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-notion-black dark:text-white">
                  {mode === 'export' ? `Encrypt ${format.toUpperCase()} export` : 'Decrypt import file'}
                </p>
                <p className="mt-1 text-[12px] text-warm-gray-500 dark:text-neutral-400">
                  {mode === 'export'
                    ? 'Use a passphrase you can remember. DLock cannot recover it.'
                    : `Selected: ${file?.name || 'encrypted export'}`}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400">Passphrase</label>
              <PasswordInput
                autoFocus
                value={passphrase}
                onChange={event => {
                  setPassphrase(event.target.value);
                  setError('');
                }}
                placeholder="Enter passphrase"
                className={`w-full bg-warm-white dark:bg-neutral-900 border ${error ? 'border-red-500' : 'border-whisper dark:border-neutral-700'} rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition`}
              />
              {error && <p className="mt-1.5 text-[12px] font-medium text-red-500">{error}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={resetPassphrase} className="flex-1 rounded-[8px] px-4 py-2.5 text-[14px] font-medium text-warm-gray-500 transition hover:bg-warm-white dark:hover:bg-neutral-800">Back</button>
              <button type="submit" disabled={isWorking} className="flex-[2] rounded-[8px] bg-notion-blue px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-notion-blue-hover disabled:opacity-60">
                {isWorking ? 'Working...' : mode === 'export' ? 'Export encrypted file' : 'Import file'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
