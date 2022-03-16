import React from 'react';
import { IconX } from '@tabler/icons';

const InputWrapper = ({
  type = 'text',
  className,
  id,
  label,
  error,
  value,
  handleChange = () => false,
  readOnly = false,
  autoFocus = false,
  placeholder,
  clearable = false,
  onClear = () => false,
}) => {
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
          className={`input form-control block w-full px-3 py-3 bg-clip-padding border border-solid border-gray-500 m-0 bg-inherit dark:bg-inherit ${
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
      {error && <span className="text-red-500 pl-4 mt-2">{error}</span>}
    </div>
  );
};

export default InputWrapper;
