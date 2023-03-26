import type { ReactNode } from 'react';
import classNames from 'classnames';

interface ButtonProps {
  children: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const Button = ({ children, primary = false, disabled = false, loading, className, onClick }: ButtonProps) => {
  const buttonClassName = classNames(
    'flex items-center justify-center px-6 py-2 rounded uppercase border border-gray-500',
    {
      'bg-gray-800 dark:bg-white text-gray-100 dark:text-gray-900 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-inherit dark:hover:bg-inherit dark:hover:border-gray-100':
        primary && !disabled,
    },
    {
      'hover:bg-gray-50 dark:hover:bg-inherit dark:text-gray-300 hover:border-gray-800 dark:hover:border-gray-100 dark:hover:text-gray-100':
        !primary && !disabled,
    },
    {
      'bg-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-not-allowed':
        disabled,
    },
    className,
  );

  return (
    <button className={buttonClassName} onClick={onClick} disabled={disabled}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 dark:text-gray-100"
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
