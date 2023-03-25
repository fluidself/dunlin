import { useCallback, memo } from 'react';
import { IconPlus, IconDownload } from '@tabler/icons';
import { useStore } from 'lib/store';
import useImport from 'utils/useImport';
import { isMobile, modifierKey } from 'utils/device';
import { Sort } from 'lib/createUserSettingsSlice';
import Tooltip from 'components/Tooltip';
import SidebarNotesSortDropdown from './SidebarNotesSortDropdown';

type Props = {
  noteSort: Sort;
  numOfNotes: number;
};

function SidebarNotesFooter(props: Props) {
  const { noteSort, numOfNotes } = props;
  const onImport = useImport();
  const isOffline = useStore(state => state.isOffline);
  const setNoteSort = useStore(state => state.setNoteSort);
  const setCommandMenuState = useStore(state => state.setCommandMenuState);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const onCreateNoteClick = useCallback(() => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    }
    setCommandMenuState({ isVisible: true });
  }, [setIsSidebarOpen, setCommandMenuState]);

  return (
    <div className="flex items-center justify-between border-t dark:border-gray-700">
      <div className="flex mx-2 my-1">
        <Tooltip content={`Create a new note (${modifierKey()}+P)`}>
          <button
            className="p-1 rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            onClick={onCreateNoteClick}
          >
            <IconPlus size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        </Tooltip>
        <Tooltip content="Import">
          <button
            className={`p-1 rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${
              isOffline && 'pointer-events-none'
            }`}
            disabled={isOffline}
            onClick={onImport}
          >
            <IconDownload
              size={16}
              className={`${isOffline ? 'text-gray-300 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </button>
        </Tooltip>
      </div>
      <span className="p-1 mx-2 my-1 overflow-hidden text-xs text-gray-500 dark:text-gray-400 overflow-ellipsis whitespace-nowrap">
        {numOfNotes} notes
      </span>
      <div className="flex mx-2 my-1">
        <SidebarNotesSortDropdown currentSort={noteSort} setCurrentSort={setNoteSort} />
      </div>
    </div>
  );
}

export default memo(SidebarNotesFooter);
