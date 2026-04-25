import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function getStrength(password) {
  if (!password) return { label: 'Trống', score: 0, color: 'bg-warm-gray-300 dark:bg-neutral-600' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 20) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Yếu', score: 1, color: 'bg-red-400' };
  if (score <= 4) return { label: 'Trung bình', score: 2, color: 'bg-amber-400' };
  if (score <= 5) return { label: 'Mạnh', score: 3, color: 'bg-emerald-400' };
  return { label: 'Rất mạnh', score: 4, color: 'bg-emerald-500' };
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

    // Animate generation
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
    if (isOpen && !generated) generate();
  }, [isOpen]);

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

  const optionLabels = [
    { key: 'uppercase', label: 'A-Z' },
    { key: 'lowercase', label: 'a-z' },
    { key: 'numbers', label: '0-9' },
    { key: 'symbols', label: '!@#' },
  ];

  return (
    <div className="mt-1">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-notion-blue hover:text-notion-blue-hover dark:text-blue-400 dark:hover:text-blue-300 transition group"
      >
        <Zap size={12} className="group-hover:scale-110 transition-transform" />
        Tạo mật khẩu tự động
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Generator Panel */}
      {isOpen && (
        <div className="mt-2 p-3 bg-warm-white dark:bg-neutral-800 border border-whisper dark:border-neutral-700 rounded-[8px] space-y-3 animate-slideDown">
          {/* Generated Password Display */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 font-mono text-[13px] bg-notion-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[6px] px-3 py-[7px] truncate select-all transition-all ${isGenerating ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
              {generated || '...'}
            </div>
            <button
              type="button"
              onClick={generate}
              className="p-[7px] rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-notion-white dark:hover:bg-neutral-700 hover:text-notion-blue dark:hover:text-blue-400 border border-whisper dark:border-neutral-700 transition active:scale-95"
              title="Tạo lại"
            >
              <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-[7px] rounded-[6px] text-warm-gray-500 dark:text-neutral-400 hover:bg-notion-white dark:hover:bg-neutral-700 hover:text-notion-blue dark:hover:text-blue-400 border border-whisper dark:border-neutral-700 transition active:scale-95"
              title="Sao chép"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Strength Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-warm-gray-300 dark:text-neutral-500">Độ mạnh</span>
              <span className={`text-[11px] font-semibold ${strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {strength.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-warm-white dark:bg-neutral-700'}`}
                />
              ))}
            </div>
          </div>

          {/* Length Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-warm-gray-300 dark:text-neutral-500">Độ dài</span>
              <span className="text-[12px] font-semibold text-notion-black dark:text-neutral-200 bg-notion-white dark:bg-neutral-700 px-1.5 py-[1px] rounded-[4px] border border-whisper dark:border-neutral-600 min-w-[28px] text-center">
                {length}
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="64"
              value={length}
              onChange={e => { setLength(parseInt(e.target.value)); }}
              onMouseUp={generate}
              onTouchEnd={generate}
              className="w-full h-[4px] appearance-none bg-warm-white dark:bg-neutral-700 rounded-full cursor-pointer accent-notion-blue"
            />
            <div className="flex justify-between text-[10px] text-warm-gray-300 dark:text-neutral-500">
              <span>6</span>
              <span>64</span>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-1.5">
            {optionLabels.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const newOpts = { ...options, [key]: !options[key] };
                  // Ensure at least one option is enabled
                  if (!Object.values(newOpts).some(v => v)) return;
                  setOptions(newOpts);
                  // Regenerate after option change
                  setTimeout(() => generate(), 0);
                }}
                className={`px-2.5 py-[4px] rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${
                  options[key]
                    ? 'bg-notion-blue/10 dark:bg-blue-500/20 text-notion-blue dark:text-blue-400 border-notion-blue/30 dark:border-blue-500/30'
                    : 'bg-warm-white dark:bg-neutral-700 text-warm-gray-300 dark:text-neutral-500 border-whisper dark:border-neutral-600 hover:border-warm-gray-300 dark:hover:border-neutral-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Use Password Button */}
          <button
            type="button"
            onClick={handleUse}
            disabled={!generated}
            className="w-full py-[7px] text-[13px] font-semibold bg-notion-blue hover:bg-notion-blue-hover disabled:opacity-50 text-white rounded-[6px] transition active:scale-[0.98]"
          >
            Sử dụng mật khẩu này
          </button>
        </div>
      )}
    </div>
  );
}
