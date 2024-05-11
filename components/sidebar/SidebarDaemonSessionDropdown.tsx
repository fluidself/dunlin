import { memo, useRef, useState } from 'react';
import { Menu } from '@headlessui/react';
import { IconDots, IconPencil, IconTrash } from '@tabler/icons';
import { usePopper } from 'react-popper';
import { type DaemonSession, useStore } from 'lib/store';
import { getReadableDatetime } from 'utils/date';
import { DropdownItem } from 'components/Dropdown';
import Portal from 'components/Portal';

type Props = {
  session: DaemonSession;
  onRenameClick: () => void;
};

function SidebarDaemonSessionDropdown({ session, onRenameClick }: Props) {
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(containerRef.current, popperElement, { placement: 'right-start' });
  const deleteDaemonSession = useStore(state => state.deleteDaemonSession);

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button
            ref={containerRef}
            className="rounded hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500 opacity-0.1 group-hover:opacity-100 group focus:outline-none absolute right-0"
          >
            <span className="flex items-center justify-center p-0.5">
              <IconDots className="text-gray-600 dark:text-gray-200" size={16} />
            </span>
          </Menu.Button>
          {open && (
            <Portal>
              <Menu.Items
                ref={setPopperElement}
                className="z-20 w-56 overflow-hidden bg-white rounded shadow-popover dark:bg-gray-800 focus:outline-none border dark:border-gray-700"
                static
                style={styles.popper}
                {...attributes.popper}
              >
                <DropdownItem onClick={onRenameClick}>
                  <IconPencil size={18} className="mr-1" />
                  <span>Rename</span>
                </DropdownItem>
                <DropdownItem onClick={() => deleteDaemonSession(session.id)}>
                  <IconTrash size={18} className="mr-1" />
                  <span>Delete</span>
                </DropdownItem>
                <div className="px-4 py-2 space-y-1 text-xs text-gray-600 border-t dark:border-gray-700 dark:text-gray-400">
                  <p>Created at {getReadableDatetime(session.createdAt)}</p>
                </div>
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
}

export default memo(SidebarDaemonSessionDropdown);
