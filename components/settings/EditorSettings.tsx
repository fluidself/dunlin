import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import supabase from 'lib/supabase';
import { useStore } from 'lib/store';
import { Note, Deck } from 'types/supabase';
import Toggle from 'components/Toggle';
import Button from 'components/home/Button';

export default function EditorSettings() {
  const { id: deckId, author_only_notes, author_control_notes } = useCurrentDeck();
  const setAuthorOnlyNotes = useStore(state => state.setAuthorOnlyNotes);

  const [authorOnly, setAuthorOnly] = useState(author_only_notes);
  const [authorControl, setAuthorControl] = useState(author_control_notes);
  const [hasChanges, setHasChanges] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authorOnly !== author_only_notes || authorControl !== author_control_notes) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [author_only_notes, author_control_notes, authorOnly, authorControl]);

  useEffect(() => {
    if (authorOnly === false) {
      setAuthorControl(false);
    }
  }, [authorOnly, authorControl]);

  const onSaveChanges = async () => {
    setProcessing(true);

    try {
      const { data: notes } = await supabase.from<Note>('notes').select('*').eq('deck_id', deckId);
      const noteUpdates = [];

      if (!notes) {
        setProcessing(false);
        return;
      }

      for (const note of notes) {
        if (authorOnly && !note.author_only) {
          noteUpdates?.push({ ...note, author_only: true });
        } else if (!authorOnly && note.author_only) {
          noteUpdates?.push({ ...note, author_only: false });
        }
      }

      await supabase.from<Note>('notes').upsert(noteUpdates);
      await supabase
        .from<Deck>('decks')
        .update({ author_only_notes: authorOnly, author_control_notes: authorControl })
        .eq('id', deckId)
        .single();

      setAuthorOnlyNotes(authorOnly);
      setHasChanges(false);
      toast.success('Settings updated!');
      window.location.assign(`${process.env.BASE_URL}/app/${deckId}`);
    } catch (error) {
      toast.error('There was an error updating the settings');
      setProcessing(false);
    }

    setProcessing(false);
  };

  return (
    <div className="flex-1 w-full h-full p-6 flex flex-col justify-between overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-medium">View-only Notes</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            If on, notes can only be edited by their original author and the DECK owner.
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
          <Toggle className="mx-2" id="2" isChecked={authorOnly} setIsChecked={setAuthorOnly} />
          <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
        </div>
        {authorOnly && (
          <>
            <div className="my-4">
              <h4 className="text-sm font-medium">Allow Note Author Control</h4>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                If on, DECK members can toggle view-only status for their own notes.
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
              <Toggle className="mx-2" id="3" isChecked={authorControl} setIsChecked={setAuthorControl} />
              <span className="text-sm text-gray-600 dark:text-gray-300">On</span>
            </div>
          </>
        )}
      </div>
      <div className={`flex justify-end ${!hasChanges && 'hidden'}`}>
        <Button primary disabled={!hasChanges || processing} loading={processing} onClick={onSaveChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
