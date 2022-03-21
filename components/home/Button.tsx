import type { ReactNode } from 'react';
import classNames from 'classnames';

interface ButtonProps {
  children: ReactNode;
  onClick?: (arg0?: any, arg1?: any) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  primary?: boolean;
}

const Button = ({ children, onClick, disabled = false, loading, className, primary = false }: ButtonProps) => {
  const buttonClassName = classNames(
    'flex items-center justify-center px-6 py-2 rounded uppercase border border-gray-500',
    { 'bg-white text-black hover:text-white hover:bg-inherit hover:border-white': primary && !disabled },
    { 'text-gray-300 hover:border-white hover:text-white': !primary && !disabled },
    { 'bg-gray-900 border-gray-700 text-gray-600 hover:bg-gray-900 cursor-not-allowed': disabled },
    className,
  );

  return (
    <button className={buttonClassName} onClick={onClick} disabled={disabled}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
