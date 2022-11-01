import { IconWifiOff } from '@tabler/icons';
import { useStore } from 'lib/store';

export default function OfflineBanner() {
  const isOffline = useStore(state => state.isOffline);

  return isOffline ? (
    <div className="flex items-center justify-center w-full py-1 font-semibold text-center text-red-900 bg-red-300">
      <IconWifiOff size={18} className="flex-shrink-0 mr-1 text-red-900" /> You are offline and some features will be unavailable
      until you reconnect to the internet.
    </div>
  ) : null;
}
