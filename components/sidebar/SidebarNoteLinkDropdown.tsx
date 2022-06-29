import { memo, useRef, useState } from 'react';
import { Menu } from '@headlessui/react';
import { IconDots } from '@tabler/icons';
import { usePopper } from 'react-popper';
import useSWR from 'swr';
import { DecryptedNote } from 'types/decrypted';
import selectDecks from 'lib/api/selectDecks';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import MoveToModal from 'components/MoveToModal';
import NoteEditMenu from 'components/NoteEditMenu';
import NoteMetadata from 'components/NoteMetadata';
import Portal from '../Portal';

type Props = {
  note: DecryptedNote;
  className?: string;
};

const SidebarNoteLinkDropdown = (props: Props) => {
  const { note, className } = props;

  const { user } = useAuth();
  const { id: currentDeckId, user_id: deckOwner } = useCurrentDeck();
  const { data: decks } = useSWR(user ? 'decks' : null, () => selectDecks(user?.id), { revalidateOnFocus: false });
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(containerRef.current, popperElement, { placement: 'right-start' });

  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);

  const authorControlNotes = decks?.find(deck => deck.id === currentDeckId)?.author_control_notes ?? false;
  const userCanEditNote = note ? (note.author_only ? note.user_id === user?.id || deckOwner === user?.id : true) : false;
  const userCanControlNotePermission = note ? (authorControlNotes ? note.user_id === user?.id : deckOwner === user?.id) : false;

  return (
    <>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button
              ref={containerRef}
              className={`rounded hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-gray-600 dark:active:bg-gray-500 ${className}`}
            >
              <span className="flex items-center justify-center w-8 h-8">
                <IconDots className="text-gray-600 dark:text-gray-200" />
              </span>
            </Menu.Button>
            {open && (
              <Portal>
                <Menu.Items
                  ref={setPopperElement}
                  className="z-20 w-56 overflow-hidden bg-white rounded shadow-popover dark:bg-gray-800 focus:outline-none"
                  static
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <NoteEditMenu
                    note={note}
                    userCanEditNote={userCanEditNote}
                    userCanControlNotePermission={userCanControlNotePermission}
                    setIsMoveToModalOpen={setIsMoveToModalOpen}
                  />
                  <NoteMetadata note={note} />
                </Menu.Items>
              </Portal>
            )}
          </>
        )}
      </Menu>
      {isMoveToModalOpen ? (
        <Portal>
          <MoveToModal noteId={note.id} setIsOpen={setIsMoveToModalOpen} />
        </Portal>
      ) : null}
    </>
  );
};

export default memo(SidebarNoteLinkDropdown);
