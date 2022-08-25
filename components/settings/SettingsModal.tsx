import { useMemo, useState } from 'react';
import { IconBrightnessHalf, IconPencil, IconBook2 } from '@tabler/icons';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { CreateJoinRenameDeckType } from 'components/CreateJoinRenameDeckModal';
import SidebarItem from '../sidebar/SidebarItem';
import Appearance from './Appearance';
import EditorSettings from './EditorSettings';
import DeckManagement from './DeckManagement';

enum SettingsTab {
  Appearance = 'appearance',
  Editor = 'editor',
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
  const [currentTab, setCurrentTab] = useState<SettingsTab>(SettingsTab.Appearance);
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
          {currentTab === SettingsTab.Appearance ? <Appearance /> : null}
          {currentTab === SettingsTab.Editor ? <EditorSettings /> : null}
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
  return (
    <div className="flex flex-col flex-none w-full py-4 border-b sm:border-b-0 sm:border-r sm:w-48 sm:h-full bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <div className="px-4 pb-2 text-sm text-gray-600 dark:text-gray-400">Settings</div>
      <SidebarItem className="flex" isHighlighted={currentTab === SettingsTab.Appearance}>
        <button
          className="flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
          onClick={() => setCurrentTab(SettingsTab.Appearance)}
        >
          <IconBrightnessHalf size={18} className="mr-1 text-gray-800 dark:text-gray-200" />
          <span>Appearance</span>
        </button>
      </SidebarItem>
      {canManageEditing && (
        <SidebarItem className="flex" isHighlighted={currentTab === SettingsTab.Editor}>
          <button
            className="flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
            onClick={() => setCurrentTab(SettingsTab.Editor)}
          >
            <IconPencil size={18} className="mr-1 text-gray-800 dark:text-gray-200" />
            <span>Editing</span>
          </button>
        </SidebarItem>
      )}
      <SidebarItem className="flex" isHighlighted={currentTab === SettingsTab.DeckManagement}>
        <button
          className="flex items-center flex-1 px-4 py-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
          onClick={() => setCurrentTab(SettingsTab.DeckManagement)}
        >
          <IconBook2 size={18} className="mr-1 text-gray-800 dark:text-gray-200" />
          <span>Manage DECKs</span>
        </button>
      </SidebarItem>
    </div>
  );
};
