import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AuthLayout(props: Props) {
  const { children, className = '' } = props;

  return <div className={`font-display ${className}`}>{children}</div>;
}
