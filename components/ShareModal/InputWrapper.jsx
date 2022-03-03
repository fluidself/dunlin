import React from 'react';
import { IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';

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
  size,
  clearable = false,
  onClear = () => false,
}) => {
  const getState = () => {
    if (error) {
      return 'alert';
    }
    return undefined;
  };
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="w-full relative">
        {clearable && (
          <IconButton size="s" className="absolute right-[10px] bottom-[31%] z-10 cursor-pointer" onClick={onClear}>
            <Close />
          </IconButton>
        )}
        <TextField
          readOnly={readOnly}
          type={type}
          id={id}
          state={getState()}
          value={value}
          onChange={event => handleChange(event.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          size={size}
          fullWidth
        />
      </div>
      {error && <span className="text-red-500 pl-4 mt-2">{error}</span>}
    </div>
  );
};

export default InputWrapper;
