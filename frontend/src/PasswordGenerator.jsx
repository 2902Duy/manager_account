import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// eslint-disable-next-line react-refresh/only-export-components
export function getStrength(password) {
  if (!password) return { label: 'Trống', score: 0, color: 'bg-warm-gray-300 dark:bg-neutral-600', text: 'text-warm-gray-300 dark:text-neutral-600' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Yếu', score: 1, color: 'bg-red-400', text: 'text-red-400' };
  if (score <= 4) return { label: 'Trung bình', score: 2, color: 'bg-amber-400', text: 'text-amber-500' };
  if (score <= 6) return { label: 'Mạnh', score: 3, color: 'bg-emerald-400', text: 'text-emerald-500' };
  return { label: 'Rất mạnh', score: 4, color: 'bg-emerald-500', text: 'text-emerald-600' };
}

export default function PasswordGenerator({ onUsePassword }) {
  const [isOpen, setIsOpen] = useState(false);
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(() => {
    let chars = '';
    if (options.uppercase) chars += CHAR_SETS.uppercase;
    if (options.lowercase) chars += CHAR_SETS.lowercase;
    if (options.numbers) chars += CHAR_SETS.numbers;
    if (options.symbols) chars += CHAR_SETS.symbols;
    if (!chars) chars = CHAR_SETS.lowercase;

    setIsGenerating(true);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTimeout(() => {
      setGenerated(result);
      setIsGenerating(false);
    }, 200);
  }, [length, options]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen && !generated) generate();
  }, [isOpen, generated, generate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUse = () => {
    if (generated && onUsePassword) {
      onUsePassword(generated);
    }
  };

  const strength = getStrength(generated);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-notion-blue hover:text-notion-blue-hover dark:text-blue-400 dark:hover:text-blue-300 transition group"
      >
        <Zap size={12} className="group-hover:scale-110 transition-transform" />
        Tạo mật khẩu tự động
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-warm-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[12px] space-y-4 animate-slideDown shadow-sm">
          {/* Display */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 font-mono text-[14px] bg-notion-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-[8px] truncate transition-all ${isGenerating ? 'opacity-50' : 'opacity-100'}`}>
              {generated || '...'}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={generate}
                className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-notion-white dark:hover:bg-neutral-700 hover:text-notion-blue transition border border-whisper dark:border-neutral-700"
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-notion-white dark:hover:bg-neutral-700 hover:text-notion-blue transition border border-whisper dark:border-neutral-700"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] text-warm-gray-400">Độ mạnh</span>
              <span className={`text-[11px] font-bold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-notion-white dark:bg-neutral-700'}`} />
              ))}
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4 pt-2">
            {/* Length */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400">Độ dài</span>
                <span className="text-[12px] font-bold text-notion-blue bg-notion-blue/5 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">{length} ký tự</span>
              </div>
              <input
                type="range" min="6" max="64" value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-1.5 bg-notion-white dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-notion-blue"
              />
              <div className="flex justify-between px-0.5 text-[10px] text-warm-gray-300 font-bold uppercase">
                <span>6</span>
                <span>64</span>
              </div>
            </div>

            {/* Types */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'uppercase', label: 'A-Z' },
                { id: 'lowercase', label: 'a-z' },
                { id: 'numbers', label: '0-9' },
                { id: 'symbols', label: '!@#' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    const newOpts = { ...options, [type.id]: !options[type.id] };
                    if (!Object.values(newOpts).some(v => v)) return;
                    setOptions(newOpts);
                  }}
                  className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all border ${
                    options[type.id]
                      ? 'bg-notion-blue text-white border-notion-blue shadow-sm'
                      : 'bg-notion-white dark:bg-neutral-900 text-warm-gray-400 dark:text-neutral-500 border-whisper dark:border-neutral-700 hover:border-warm-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleUse}
            disabled={!generated}
            className="w-full py-2.5 text-[13px] font-bold bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-50 text-white rounded-[8px] transition shadow-md active:scale-[0.98]"
          >
            Sử dụng mật khẩu này
          </button>
        </div>
      )}
    </div>
  );
}
