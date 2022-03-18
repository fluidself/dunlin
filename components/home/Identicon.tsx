import { useEffect, useRef } from 'react';
import Jazzicon from '@metamask/jazzicon';
import { useAuth } from 'utils/useAuth';

type Props = {
  diameter: number;
  className?: string;
};

export default function Identicon({ diameter, className }: Props) {
  const ref = useRef<HTMLDivElement>();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && ref.current) {
      ref.current.innerHTML = '';
      ref.current.appendChild(Jazzicon(diameter, parseInt(user.id.slice(2, 10), 16)));
    }
  }, [user]);

  return <div className={`rounded-full bg-background ${className}`} ref={ref as any} />;
}
