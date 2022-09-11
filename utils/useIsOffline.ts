import { useEffect } from 'react';
import { useStore } from 'lib/store';

export default function useIsOffline() {
  const setIsOffline = useStore(state => state.setIsOffline);

  useEffect(() => {
    const setOffline = () => setIsOffline(true);
    const setOnline = () => setIsOffline(false);

    window.addEventListener('offline', setOffline);
    window.addEventListener('online', setOnline);

    return () => {
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('online', setOnline);
    };
  }, []);
}
