import React from 'react';
import { IconX } from '@tabler/icons';

export default function InputWrapper({
  type = 'text',
  className = '',
  id,
  label,
  error = '',
  value,
  handleChange,
  readOnly = false,
  autoFocus = false,
  placeholder = '',
  clearable = false,
  onClear = () => false,
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="w-full relative">
        {clearable && (
          <button className="absolute right-[10px] bottom-[31%] z-10 cursor-pointer" onClick={onClear}>
            <IconX size={16} />
          </button>
        )}

        <input
          className={`input bg-transparent dark:border-gray-500 block w-full px-3 py-3 mt-1 ${
            error ? 'border-red-500' : ''
          }`}
          readOnly={readOnly}
          type={type}
          id={id}
          value={value}
          onChange={event => handleChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>
      {error && <span className="text-red-500 pl-1 mt-1">{error}</span>}
    </div>
  );
}
