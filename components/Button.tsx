interface ButtonProps {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button = ({ children, onClick, disabled, className }: ButtonProps) => {
  return (
    <button
      className={`flex justify-center hover:text-offWhite border rounded-sm border-white px-6 py-2 uppercase disabled:border-gray-500 disabled:cursor-not-allowed disabled:text-gray-500 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
