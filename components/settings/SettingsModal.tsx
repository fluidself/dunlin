import { useMemo, useState } from 'react';
import { IconBook2, IconFileText, IconPencilOff, IconX } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useStore } from 'lib/store';
import type { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';
import SettingsSidebarItem from './SettingsSidebarItem';
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
        <div className="z-30 flex flex-col w-full h-full max-w-full overflow-hidden rounded sm:flex-row sm:max-h-176 sm:w-240 shadow-popover    bg-gray-900 border border-gray-600 relative">
          <SettingsModalSidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            canManageEditing={canManageEditing}
          />
          {currentTab === SettingsTab.Editor ? <EditorSettings /> : null}
          {currentTab === SettingsTab.Permissions ? <Permissions /> : null}
          {currentTab === SettingsTab.DeckManagement ? (
            <DeckManagement setCreateJoinRenameModal={setCreateJoinRenameModal} />
          ) : null}
          <button onClick={() => setIsOpen(false)} className="absolute top-1 right-1 text-gray-300 hover:text-gray-100">
            <IconX size={20} />
          </button>
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
    <div className="flex flex-col flex-none w-full py-4 border-b sm:border-b-0 sm:border-r sm:w-48 sm:h-full bg-gray-900 border-gray-600">
      <div className="px-4 pb-2 text-sm text-gray-400">Settings</div>
      <SettingsSidebarItem
        className="flex hover:bg-gray-700 active:bg-gray-700"
        isHighlighted={currentTab === SettingsTab.Editor}
      >
        <button
          className="flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
          onClick={() => setCurrentTab(SettingsTab.Editor)}
        >
          <IconFileText size={18} className="mr-1 text-gray-200" />
          <span>Editor</span>
        </button>
      </SettingsSidebarItem>
      {canManageEditing && (
        <SettingsSidebarItem
          className={`flex ${
            isOffline ? 'hover:bg-gray-900 active:bg-gray-900' : 'hover:bg-gray-700 active:bg-gray-700'
          }`}
          isHighlighted={!isOffline && currentTab === SettingsTab.Permissions}
        >
          <button
            className={`flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap ${
              isOffline ? 'text-gray-500 pointer-events-none' : ''
            }`}
            disabled={isOffline}
            onClick={() => setCurrentTab(SettingsTab.Permissions)}
          >
            <IconPencilOff size={18} className={`mr-1 ${isOffline ? 'text-gray-500' : 'text-gray-200'}`} />
            <span>Permissions</span>
          </button>
        </SettingsSidebarItem>
      )}
      <SettingsSidebarItem
        className={`flex ${
          isOffline ? 'hover:bg-gray-900 active:bg-gray-900' : 'hover:bg-gray-700 active:bg-gray-700'
        }`}
        isHighlighted={!isOffline && currentTab === SettingsTab.DeckManagement}
      >
        <button
          className={`flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap ${
            isOffline ? 'text-gray-500 pointer-events-none' : ''
          }`}
          disabled={isOffline}
          onClick={() => setCurrentTab(SettingsTab.DeckManagement)}
        >
          <IconBook2 size={18} className={`mr-1 ${isOffline ? 'text-gray-500' : 'text-gray-200'}`} />
          <span>Workspaces</span>
        </button>
      </SettingsSidebarItem>
    </div>
  );
};
