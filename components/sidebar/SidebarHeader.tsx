import type { Dispatch, SetStateAction } from 'react';
import { IconChevronsLeft } from '@tabler/icons';
import { useStore } from 'lib/store';
import Tooltip from 'components/Tooltip';

type Props = {
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Header(props: Props) {
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);

  return (
    <div className="relative">
      <div className="flex items-center justify-between w-full py-2 pl-6 overflow-x-hidden text-left text-gray-800  dark:text-gray-200  overflow-ellipsis whitespace-nowrap focus:outline-none cursor-default border-b border-gray-700">
        <span className="mr-1 font-semibold select-none">DECK</span>
        <Tooltip content="Collapse sidebar (Ctrl+\)" placement="right">
          <span
            className="p-1 mr-2 rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-600 dark:active:bg-gray-500 cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              setIsSidebarOpen(false);
            }}
          >
            <IconChevronsLeft className="text-gray-500 dark:text-gray-400" />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
