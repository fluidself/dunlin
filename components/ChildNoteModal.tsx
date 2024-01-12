import { useMemo, useState } from 'react';
import { IconFilePlus, IconX } from '@tabler/icons';
import { toast } from 'react-toastify';
import { Deck } from 'types/supabase';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import supabase from 'lib/supabase';
import { store, useStore } from 'lib/store';
import upsertNote from 'lib/api/upsertNote';
import { getDefaultEditorValue } from 'editor/constants';
import useOnNoteLinkClick from 'editor/useOnNoteLinkClick';
import Button from 'components/Button';

type Props = {
  noteId: string;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ChildNoteModal(props: Props) {
  const { noteId, setIsOpen } = props;
  const { user } = useAuth();
  const { id: deckId } = useCurrentDeck();
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const moveNoteTreeItem = useStore(state => state.moveNoteTreeItem);
  const lastOpenNoteId = useStore(state => state.openNoteIds[state.openNoteIds.length - 1]);
  const { onClick: onNoteLinkClick } = useOnNoteLinkClick(lastOpenNoteId);
  const [inputText, setInputText] = useState('');

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

  const onConfirm = async () => {
    if (!deckId || !user || !inputText) return;

    const newNote = {
      deck_id: deckId,
      user_id: user.id,
      author_only: authorOnlyNotes,
      title: inputText,
      content: getDefaultEditorValue(),
    };
    const note = await upsertNote(newNote);
    if (!note) {
      toast.error(`There was an error creating the note ${inputText}.`);
      return;
    }
    moveNoteTreeItem(note.id, noteId);
    setIsOpen(false);
    onNoteLinkClick(note.id, true);
    await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', deckId);
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-white dark:bg-gray-900 dark:text-gray-200 border dark:border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 py-2 w-full bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center">
              <IconFilePlus className="ml-4 mr-1 text-gray-600 dark:text-gray-200" size={24} />
              <span className="text-lg font-heading tracking-wide px-2 border-none focus:ring-0">Add child note</span>
            </div>
            <button
              className="mb-6 mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br dark:bg-gray-800 dark:border-gray-700">
            <input
              type="text"
              className="w-full py-3 px-2 text-xl border-none rounded focus:ring-0 bg-gray-50 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Enter note title"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onConfirm();
                }
              }}
              autoComplete="off"
              autoFocus
            />
            <div className="flex justify-end space-x-4 mt-4">
              <Button primary onClick={onConfirm}>
                Create
              </Button>
              <Button onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
