import { useMemo, useState } from 'react';
import { IconTrash, IconX } from '@tabler/icons';
import { DecryptedNote } from 'types/decrypted';
import useHotkeys from 'utils/useHotkeys';
import useDeleteNote from 'utils/useDeleteNote';
import useBacklinks from 'editor/backlinks/useBacklinks';
import { useStore } from 'lib/store';
import Button from 'components/Button';

type Props = {
  note: DecryptedNote;
  setIsOpen: (isOpen: boolean) => void;
};

export default function DeleteNoteModal(props: Props) {
  const { note, setIsOpen } = props;
  const { linkedBacklinks } = useBacklinks(note.id);
  const onDeleteClick = useDeleteNote(note.id);
  const setConfirmNoteDeletion = useStore(state => state.setConfirmNoteDeletion);
  const [isChecked, setIsChecked] = useState(false);

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

  const onConfirm = () => {
    if (isChecked) {
      setConfirmNoteDeletion(false);
    }

    setIsOpen(false);
    onDeleteClick();
  };

  const singleBacklink = linkedBacklinks.length === 1;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-white dark:bg-gray-900 dark:text-gray-200 border border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 w-full">
            <div className="flex items-center">
              <IconTrash className="ml-4 mr-1 text-gray-500 dark:text-gray-200" size={32} />
              <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0">Delete note</span>
            </div>
            <button
              className="mb-6 mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-2">{`Are you sure you want to delete "${note.title}"?`}</div>
            {linkedBacklinks.length ? (
              <div className="mb-2 text-red-500">{`There ${singleBacklink ? 'is' : 'are'} currently ${
                linkedBacklinks.length
              } link${!singleBacklink ? 's' : ''} pointing to this note.`}</div>
            ) : null}
            <div className="flex justify-between mt-4">
              <div className="flex items-center justify-center select-none" onClick={() => setIsChecked(!isChecked)}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                  className="bg-transparent border-2 hover:cursor-pointer p-2 mr-2 rounded-sm text-primary-500 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 focus:ring-0 hover:text-primary-600 active:text-primary-700"
                />
                <span>Don&apos;t ask again</span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <Button primary onClick={onConfirm}>
                  Delete
                </Button>
                <Button onClick={() => setIsOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
