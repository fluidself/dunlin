import { useMemo, useState } from 'react';
import { IconBook2, IconFileText, IconPencilOff } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useStore } from 'lib/store';
import type { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';
import SidebarItem from '../sidebar/SidebarItem';
import EditorSettings from './EditorSettings';
import Permissions from './Permissions';
import DeckManagement from './DeckManagement';

enum SettingsTab {
  Editor = 'editor',
  Permissions = 'permissions',
  DeckManagement = 'deckmanagement',
}

type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCreateJoinRenameModal: (modalStatus: { open: boolean; type: CreateJoinRenameDeckType }) => void;
};

export default function SettingsModal(props: Props) {
  const { setIsOpen, setCreateJoinRenameModal } = props;
  const { user } = useAuth();
  const { user_id } = useCurrentDeck();
  const [currentTab, setCurrentTab] = useState<SettingsTab>(SettingsTab.Editor);
  const canManageEditing = user?.id === user_id;

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setIsOpen(false),
      },
    ],
    [setIsOpen],
  );
  useHotkeys(hotkeys);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex items-center justify-center h-screen p-6">
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden bg-white rounded sm:flex-row sm:max-h-176 sm:w-240 shadow-popover border border-gray-600">
          <SettingsModalSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} canManageEditing={canManageEditing} />
          {currentTab === SettingsTab.Editor ? <EditorSettings /> : null}
          {currentTab === SettingsTab.Permissions ? <Permissions /> : null}
          {currentTab === SettingsTab.DeckManagement ? (
            <DeckManagement setCreateJoinRenameModal={setCreateJoinRenameModal} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

type SettingsModalSidebarProps = {
  currentTab: SettingsTab;
  setCurrentTab: (tab: SettingsTab) => void;
  canManageEditing: boolean;
};

const SettingsModalSidebar = (props: SettingsModalSidebarProps) => {
  const { currentTab, setCurrentTab, canManageEditing } = props;
  const isOffline = useStore(state => state.isOffline);

  return (
    <div className="flex flex-col flex-none w-full py-4 border-b sm:border-b-0 sm:border-r sm:w-48 sm:h-full bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <div className="px-4 pb-2 text-sm text-gray-600 dark:text-gray-400">Settings</div>
      <SidebarItem className="flex" isHighlighted={currentTab === SettingsTab.Editor}>
        <button
          className="flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
          onClick={() => setCurrentTab(SettingsTab.Editor)}
        >
          <IconFileText size={18} className="mr-1 text-gray-800 dark:text-gray-200" />
          <span>Editor</span>
        </button>
      </SidebarItem>
      {canManageEditing && (
        <SidebarItem
          className={`flex ${isOffline && 'dark:hover:bg-gray-800 dark:active:bg-gray-800'}`}
          isHighlighted={!isOffline && currentTab === SettingsTab.Permissions}
        >
          <button
            className={`flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap ${
              isOffline && 'dark:text-gray-500 pointer-events-none'
            }`}
            disabled={isOffline}
            onClick={() => setCurrentTab(SettingsTab.Permissions)}
          >
            <IconPencilOff size={18} className={`mr-1 text-gray-800 dark:text-gray-200 ${isOffline && 'dark:text-gray-500'}`} />
            <span>Permissions</span>
          </button>
        </SidebarItem>
      )}
      <SidebarItem
        className={`flex ${isOffline && 'dark:hover:bg-gray-800 dark:active:bg-gray-800'}`}
        isHighlighted={!isOffline && currentTab === SettingsTab.DeckManagement}
      >
        <button
          className={`flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap ${
            isOffline && 'dark:text-gray-500 pointer-events-none'
          }`}
          disabled={isOffline}
          onClick={() => setCurrentTab(SettingsTab.DeckManagement)}
        >
          <IconBook2 size={18} className={`mr-1 text-gray-800 dark:text-gray-200 ${isOffline && 'dark:text-gray-500'}`} />
          <span>Manage DECKs</span>
        </button>
      </SidebarItem>
    </div>
  );
};
