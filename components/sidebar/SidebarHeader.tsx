import type { Dispatch, SetStateAction } from 'react';
import { Menu } from '@headlessui/react';
import {
  IconLogout,
  IconSelector,
  IconChevronsLeft,
  IconCode,
  IconShare,
  IconGitPullRequest,
  IconFolderPlus,
  IconInfoCircle,
  IconSettings,
} from '@tabler/icons';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { isMobile, modifierKey } from 'utils/device';
import { useStore } from 'lib/store';
import Tooltip from 'components/Tooltip';
import { DropdownItem } from 'components/Dropdown';
import { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';

type Props = {
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setCreateJoinRenameModal: (modalStatus: { open: boolean; type: CreateJoinRenameDeckType }) => void;
};

export default function Header(props: Props) {
  const { setIsSettingsOpen, setCreateJoinRenameModal } = props;
  const { user, signOut } = useAuth();
  const { user_id } = useCurrentDeck();
  const isOffline = useStore(state => state.isOffline);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const setShareModalOpen = useStore(state => state.setShareModalOpen);

  return (
    <>
      <div className="relative">
        <Menu>
          <Menu.Button className="flex items-center justify-between w-full py-2 pl-6 overflow-x-hidden text-left text-gray-800 hover:bg-gray-200 active:bg-gray-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 overflow-ellipsis whitespace-nowrap focus:outline-none border-b border-gray-700">
            <div className="flex items-center flex-1">
              <span className="mr-1 font-semibold select-none">Dunlin</span>
              <IconSelector size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <Tooltip content={`Collapse sidebar (${modifierKey()}+\\)`} placement="right">
              <span
                className="p-1 mr-2 rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-600 dark:active:bg-gray-500"
                onClick={e => {
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
              >
                <IconChevronsLeft className="text-gray-500 dark:text-gray-400" />
              </span>
            </Tooltip>
          </Menu.Button>
          <Menu.Items className="absolute z-20 w-56 overflow-hidden bg-white rounded left-6 top-full shadow-popover dark:bg-gray-800 focus:outline-none border border-gray-500">
            <DropdownItem
              onClick={() => {
                if (isMobile()) setIsSidebarOpen(false);
                setIsSettingsOpen(true);
              }}
            >
              <IconSettings size={18} className="mr-1" />
              <span>Settings</span>
            </DropdownItem>
            {user?.id === user_id && (
              <>
                <DropdownItem disabled={isOffline} onClick={() => setShareModalOpen(true)}>
                  <IconShare size={18} className="mr-1" />
                  <span>Share</span>
                </DropdownItem>
              </>
            )}
            <DropdownItem
              disabled={isOffline}
              onClick={() => setCreateJoinRenameModal({ open: true, type: CreateJoinRenameDeckType.Create })}
            >
              <IconFolderPlus size={18} className="mr-1" />
              <span>Create</span>
            </DropdownItem>
            <DropdownItem
              disabled={isOffline}
              onClick={() => setCreateJoinRenameModal({ open: true, type: CreateJoinRenameDeckType.Join })}
            >
              <IconGitPullRequest size={18} className="mr-1" />
              <span>Join</span>
            </DropdownItem>
            <DropdownItem
              disabled={isOffline}
              as="a"
              className="border-t dark:border-gray-700"
              href={`${process.env.BASE_URL}/docs`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconInfoCircle size={18} className="mr-1" />
              <span>Docs</span>
            </DropdownItem>
            <DropdownItem
              disabled={isOffline}
              as="a"
              href="https://github.com/fluidself/dunlin"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconCode size={18} className="mr-1" />
              <span>Code</span>
            </DropdownItem>
            <DropdownItem disabled={isOffline} onClick={signOut}>
              <IconLogout size={18} className="mr-1" />
              <span>Sign out</span>
            </DropdownItem>
          </Menu.Items>
        </Menu>
      </div>
    </>
  );
}
