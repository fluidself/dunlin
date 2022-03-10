interface ButtonProps {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ children, onClick, disabled }: ButtonProps) => {
  return (
    <button
      className="flex justify-between hover:text-offWhite border rounded-sm border-white px-6 py-2 uppercase disabled:border-gray-500 disabled:cursor-not-allowed disabled:text-gray-500"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
