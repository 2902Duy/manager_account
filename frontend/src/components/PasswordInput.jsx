import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-warm-gray-300 transition hover:bg-warm-white hover:text-notion-blue dark:hover:bg-neutral-700 ${buttonClassName}`}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
