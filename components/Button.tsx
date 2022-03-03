interface ButtonProps {
  children: any;
  onClick?: () => void;
}

const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button className="flex hover:text-offWhite border border-white px-6 py-2" onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
