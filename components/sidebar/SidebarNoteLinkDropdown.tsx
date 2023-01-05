import { memo, useRef, useState } from 'react';
import { Menu } from '@headlessui/react';
import { IconDots } from '@tabler/icons';
import { usePopper } from 'react-popper';
import { DecryptedNote } from 'types/decrypted';
import MoveToModal from 'components/MoveToModal';
import DeleteNoteModal from 'components/DeleteNoteModal';
import NoteEditMenu from 'components/NoteEditMenu';
import NoteMetadata from 'components/NoteMetadata';
import Portal from '../Portal';

type Props = {
  note: DecryptedNote;
  className?: string;
};

const SidebarNoteLinkDropdown = (props: Props) => {
  const { note, className } = props;

  const containerRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(containerRef.current, popperElement, { placement: 'right-start' });

  const [isMoveToModalOpen, setIsMoveToModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
                    setIsMoveToModalOpen={setIsMoveToModalOpen}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
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
      {isDeleteModalOpen ? (
        <Portal>
          <DeleteNoteModal note={note} setIsOpen={setIsDeleteModalOpen} />
        </Portal>
      ) : null}
    </>
  );
};

export default memo(SidebarNoteLinkDropdown);
