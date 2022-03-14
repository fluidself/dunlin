import type { Dispatch, SetStateAction } from 'react';
import { Menu } from '@headlessui/react';
import { IconChevronsLeft, IconLogout } from '@tabler/icons';
import { useStore } from 'lib/store';
import { useAuth } from 'utils/useAuth';
import Tooltip from 'components/Tooltip';
// import { isMobile } from 'utils/device';
// import { DropdownItem } from 'components/Dropdown';

type Props = {
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Header(props: Props) {
  const { user } = useAuth();
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);

  return (
    <div className="relative">
      <Menu>
        <Menu.Button className="flex items-center justify-between w-full py-2 pl-6 overflow-x-hidden text-left text-gray-800  active:bg-gray-300 dark:text-gray-200  dark:active:bg-gray-600 overflow-ellipsis whitespace-nowrap focus:outline-none cursor-default border-b border-gray-700">
          <div className="flex items-center flex-1">
            <span className="mr-1 font-semibold select-none">DECK</span>
            {/* <IconSelector size={18} className="text-gray-500 dark:text-gray-400" /> */}
            {/* TODO: avatar icon here? */}
            <p className="px-4 pt-2 pb-1 overflow-hidden text-xs text-gray-600 overflow-ellipsis dark:text-gray-400">{`${user?.id.slice(
              0,
              6,
            )}...${user?.id.slice(-4)}`}</p>
          </div>
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
        </Menu.Button>
        {/* <Menu.Items className="absolute z-20 w-56 overflow-hidden bg-white rounded left-6 top-full shadow-popover dark:bg-gray-800 focus:outline-none">
          <p className="px-4 pt-2 pb-1 overflow-hidden text-xs text-gray-600 overflow-ellipsis dark:text-gray-400">{`${user?.id.slice(
            0,
            6,
          )}...${user?.id.slice(-4)}`}</p>
          <DropdownItem
            onClick={() => {
              if (isMobile()) {
                setIsSidebarOpen(false);
              }
              setIsSettingsOpen(true);
            }}
          >
            <IconSettings size={18} className="mr-1" />
            <span>Settings</span>
          </DropdownItem>
          TODO: Github / contact here?
          <DropdownItem className="border-t dark:border-gray-700" onClick={disconnect}>
            <IconLogout size={18} className="mr-1" />
            <span>Sign out</span>
          </DropdownItem>
        </Menu.Items> */}
      </Menu>
    </div>
  );
}
