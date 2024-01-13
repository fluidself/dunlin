import { IconGhost2 } from '@tabler/icons';
import { modifierKey } from 'utils/device';
import { useStore } from 'lib/store';
import Tooltip from 'components/Tooltip';

export default function SummonDaemonButton() {
  const isOffline = useStore(state => state.isOffline);
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const isDaemonSidebarOpen = useStore(state => state.isDaemonSidebarOpen);
  const setIsDaemonSidebarOpen = useStore(state => state.setIsDaemonSidebarOpen);

  if (!isDaemonUser || isDaemonSidebarOpen) return null;

  return (
    <div
      id="summon-daemon-button"
      className={`flex items-center justify-center absolute top-0 right-4 ${isOffline ? 'py-[37px]' : 'py-[5px]'}`}
    >
      <Tooltip content={`Summon daemon (${modifierKey()}+Shift+D)`}>
        <button
          className={`rounded hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${
            isOffline ? 'pointer-events-none' : ''
          }`}
          disabled={isOffline}
          onClick={() => setIsDaemonSidebarOpen(isOpen => !isOpen)}
        >
          <span className="flex items-center justify-center w-7 h-7">
            <IconGhost2
              size={20}
              className={`${isOffline ? 'text-gray-300 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
