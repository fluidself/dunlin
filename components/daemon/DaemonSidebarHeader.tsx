import { IconChevronsRight } from '@tabler/icons';
import { modifierKey } from 'utils/device';
import { SidebarTab, useStore } from 'lib/store';
import Tooltip from 'components/Tooltip';

export default function DaemonSidebarHeader() {
  const setIsDaemonSidebarOpen = useStore(state => state.setIsDaemonSidebarOpen);
  const setSidebarTab = useStore(state => state.setSidebarTab);

  return (
    <div className="flex items-center w-full py-1.5 pl-2">
      <Tooltip content={`Collapse daemon (${modifierKey()}+Shift+D)`} placement="left">
        <button
          aria-label="Open sidebar"
          className={`p-1 rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600`}
          onClick={() => {
            setSidebarTab(SidebarTab.Notes);
            setIsDaemonSidebarOpen(false);
          }}
        >
          <IconChevronsRight size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </Tooltip>
    </div>
  );
}
