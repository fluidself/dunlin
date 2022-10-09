import { useCallback, useRef, useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import Select from 'react-select';
import { IconDots, IconDownload, IconUpload, IconCloudDownload, IconX, IconCopy, IconPencil, IconEye } from '@tabler/icons';
import { usePopper } from 'react-popper';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Portal from 'components/Portal';
import { useCurrentNote } from 'utils/useCurrentNote';
import { store, useStore } from 'lib/store';
import serialize, { SerializeOptions } from 'editor/serialization/serialize';
import { DecryptedNote } from 'types/decrypted';
import useImport from 'utils/useImport';
import { queryParamToArray } from 'utils/url';
import { addEllipsis } from 'utils/string';
import { useAuth } from 'utils/useAuth';
import copyToClipboard from 'utils/copyToClipboard';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import selectDecks from 'lib/api/selectDecks';
import Tooltip from 'components/Tooltip';
import OpenSidebarButton from 'components/sidebar/OpenSidebarButton';
import { DropdownItem } from 'components/Dropdown';
import NoteEditMenu from 'components/NoteEditMenu';
import NoteMetadata from 'components/NoteMetadata';
import MoveToModal from 'components/MoveToModal';
import PublishNoteModal from 'components/PublishNoteModal';
import Identicon from 'components/home/Identicon';
import { NoteHeaderDivider } from './NoteHeaderDivider';

type DeckSelectOption = {
  label: string;
  id: string;
  value: string;
};

export default function NoteHeader() {
  const currentNote = useCurrentNote();
  const onImport = useImport();
  const { user } = useAuth();
  const isOffline = useStore(state => state.isOffline);
  const { id: currentDeckId, user_id: deckOwner } = useCurrentDeck();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const [deckOptions, setDeckOptions] = useState<DeckSelectOption[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<DeckSelectOption | null>(null);
  const router = useRouter();
  const {
    query: { deckId, stack: stackQuery },
  } = router;

  useEffect(() => {
    const decksToOptions = decks?.map(deck => ({
      label: `${deck.deck_name} (${deck.id})`,
      id: deck.id,
      value: deck.id,
    }));
    const currentlySelectedDeck = decksToOptions?.find(deckOption => deckOption.id === currentDeckId);
    if (decksToOptions) setDeckOptions(decksToOptions);
    if (currentlySelectedDeck) setSelectedDeck(currentlySelectedDeck);
  }, [decks, currentDeckId]);

  const isSidebarButtonVisible = useStore(state => !state.isSidebarOpen && state.openNoteIds?.[0] === currentNote.id);
  const isCloseButtonVisible = useStore(state => state.openNoteIds.length > 1);
  const note = useStore(state => state.notes[currentNote.id]);

  const onClosePane = useCallback(() => {
    const currentNoteIndex = store.getState().openNoteIds.findIndex(openNoteId => openNoteId === currentNote.id);
    const stackedNoteIds = queryParamToArray(stackQuery);

    if (currentNoteIndex < 0) {
      return;
    }

    if (currentNoteIndex === 0) {
      // Changes current note to first note in stack
      router.push(
        {
          pathname: router.pathname,
          query: { deckId, id: stackedNoteIds[0], stack: stackedNoteIds.slice(1) },
        },
        undefined,
        { shallow: true },
      );
    } else {
      // Remove from stacked notes and shallowly route
      stackedNoteIds.splice(
        currentNoteIndex - 1, // Stacked notes don't include the main note
        1,
      );
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, stack: stackedNoteIds },
        },
        undefined,
        { shallow: true },
      );
    }
  }, [currentNote.id, stackQuery, router, deckId]);

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(menuButtonRef.current, popperElement, { placement: 'bottom-start' });

  const onExportClick = useCallback(async () => {
    saveAs(getNoteAsBlob(note), `${note.title}.md`);
  }, [note]);

  const onExportAllClick = useCallback(async () => {
    const zip = new JSZip();

    const notes = Object.values(store.getState().notes);
    for (const note of notes) {
      zip.file(`${note.title}.md`, getNoteAsBlob(note));
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    saveAs(zipContent, 'notes-export.zip');
  }, []);

  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const onPublishClick = useCallback(() => setIsPublishModalOpen(true), []);

  const renderPermissionIcon = () => {
    if (!note || isCloseButtonVisible) return null;

    const viewOnlyTooltipContent =
      deckOwner === user?.id
        ? 'Note author and DECK owner can edit'
        : `${note.user_id === user?.id ? 'Only you' : 'Note author'} and DECK owner can edit`;

    return note.author_only ? (
      <Tooltip content={viewOnlyTooltipContent}>
        <span className="flex items-center justify-center w-8 h-8">
          <IconEye className="text-gray-600 dark:text-gray-400" />
        </span>
      </Tooltip>
    ) : (
      <Tooltip content="All DECK members can edit">
        <span className="flex items-center justify-center w-8 h-8">
          <IconPencil className="text-gray-600 dark:text-gray-400" />
        </span>
      </Tooltip>
    );
  };

  const buttonClassName = 'rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600';
  const iconClassName = 'text-gray-600 dark:text-gray-300';

  return (
    <div className="flex items-center justify-between w-full px-4 py-1 text-right">
      <div>{isSidebarButtonVisible ? <OpenSidebarButton /> : null}</div>
      <div>
        {isCloseButtonVisible ? (
          <Tooltip content="Close pane">
            <button className={buttonClassName} onClick={onClosePane} title="Close pane">
              <span className="flex items-center justify-center w-8 h-8">
                <IconX className={iconClassName} />
              </span>
            </button>
          </Tooltip>
        ) : null}
        <div className="inline-flex justify-center">
          {!isCloseButtonVisible && user && (
            <div className="flex items-center">
              <div className="mr-1">
                <Select
                  className="react-select-container-header"
                  classNamePrefix="react-select-header"
                  placeholder="Select DECK..."
                  isDisabled={isOffline}
                  options={deckOptions}
                  value={selectedDeck}
                  onChange={value => {
                    setSelectedDeck(value);
                    if (value?.id !== currentDeckId) {
                      window.location.assign(`${process.env.BASE_URL}/app/${value?.id}`);
                    }
                  }}
                />
              </div>
              <Tooltip content="Copy DECK ID">
                <button
                  className={buttonClassName}
                  onClick={async () => selectedDeck?.id && (await copyToClipboard(selectedDeck.id))}
                >
                  <span className="flex items-center justify-center w-8 h-8">
                    <IconCopy className={iconClassName} />
                  </span>
                </button>
              </Tooltip>
              <NoteHeaderDivider />
              <div className="px-2 pt-1 pb-1 text-sm text-gray-600 overflow-ellipsis dark:text-gray-400">
                {user ? addEllipsis(user?.id) : ''}
              </div>
              <Identicon diameter={16} className="w-5 h-5 mr-2" />
              <NoteHeaderDivider />
            </div>
          )}
          <Menu>
            {({ open }) => (
              <>
                <div className="flex items-center">
                  {renderPermissionIcon()}
                  <NoteHeaderDivider />
                  <Menu.Button ref={menuButtonRef} className={buttonClassName} title="Options (import, export, etc.)">
                    <Tooltip content="Options (export, import, etc.)">
                      <span className="flex items-center justify-center w-8 h-8">
                        <IconDots className={iconClassName} />
                      </span>
                    </Tooltip>
                  </Menu.Button>
                </div>
                {open && (
                  <Portal>
                    <Menu.Items
                      ref={setPopperElement}
                      className="z-10 w-56 overflow-hidden bg-white rounded shadow-popover dark:bg-gray-800 focus:outline-none"
                      static
                      style={styles.popper}
                      {...attributes.popper}
                    >
                      <DropdownItem disabled={isOffline} onClick={onImport}>
                        <IconDownload size={18} className="mr-1" />
                        <span>Import</span>
                      </DropdownItem>
                      <DropdownItem onClick={onExportClick}>
                        <IconUpload size={18} className="mr-1" />
                        <span>Export</span>
                      </DropdownItem>
                      <DropdownItem onClick={onExportAllClick}>
                        <IconCloudDownload size={18} className="mr-1" />
                        <span>Export all</span>
                      </DropdownItem>
                      <NoteEditMenu note={note} setIsMoveToModalOpen={setIsMoveToModalOpen} onPublishClick={onPublishClick} />
                      <NoteMetadata note={note} />
                    </Menu.Items>
                  </Portal>
                )}
              </>
            )}
          </Menu>
        </div>
      </div>
      {isMoveToModalOpen ? (
        <Portal>
          <MoveToModal noteId={currentNote.id} setIsOpen={setIsMoveToModalOpen} />
        </Portal>
      ) : null}
      {isPublishModalOpen ? (
        <Portal>
          <PublishNoteModal note={note} userId={user?.id} setIsOpen={setIsPublishModalOpen} />
        </Portal>
      ) : null}
    </div>
  );
}

export const getSerializedNote = (note: DecryptedNote, opts: SerializeOptions) =>
  note.content.map(n => serialize(n, opts)).join('');

const getNoteAsBlob = (note: DecryptedNote) => {
  const serializedContent = getSerializedNote(note, { forPublication: false, publishLinkedNotes: false });
  const blob = new Blob([serializedContent], {
    type: 'text/markdown;charset=utf-8',
  });
  return blob;
};
