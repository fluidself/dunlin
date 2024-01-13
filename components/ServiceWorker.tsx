import { useEffect } from 'react';

type Props = {
  children: JSX.Element;
};

export default function ServiceWorker(props: Props) {
  const { children } = props;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox;

      // Show a banner when a service worker has updated and is waiting to install
      const showUpdateBanner = () => {
        const updateBanner = document.getElementById('update-banner');
        const summonDaemonButton = document.getElementById('summon-daemon-button');
        if (updateBanner) {
          updateBanner.classList.replace('hidden', 'block');
        }
        if (summonDaemonButton) {
          summonDaemonButton.classList.replace('py-[5px]', 'py-[37px]');
        }
      };

      wb.addEventListener('waiting', showUpdateBanner);

      // Register service worker
      wb.register();
    }
  }, []);

  return children;
}
