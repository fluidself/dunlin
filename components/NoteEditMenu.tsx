import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { IconCornerDownRight, IconTrash, IconPencil, IconEye, IconSend } from '@tabler/icons';
import { toast } from 'react-toastify';
import { DecryptedNote } from 'types/decrypted';
import { Note, Deck } from 'types/supabase';
import useDeleteNote from 'utils/useDeleteNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { useAuth } from 'utils/useAuth';
import { store, useStore } from 'lib/store';
import supabase from 'lib/supabase';
import { DropdownItem } from 'components/Dropdown';

type Props = {
  note: DecryptedNote;
  setIsMoveToModalOpen: Dispatch<SetStateAction<boolean>>;
  onPublishClick?: () => void;
};

export default function NoteEditMenu(props: Props) {
  const { note, setIsMoveToModalOpen, onPublishClick } = props;

  const { user } = useAuth();
  const { id: deckId, user_id: deckOwner } = useCurrentDeck();
  const isOffline = useStore(state => state.isOffline);
  const onDeleteClick = useDeleteNote(note.id);
  const onMoveToClick = useCallback(() => setIsMoveToModalOpen(true), [setIsMoveToModalOpen]);
  const [authorControlNotes, setAuthorControlNotes] = useState<boolean>();

  const userCanEditNote = note.author_only ? note.user_id === user?.id || deckOwner === user?.id : true;
  const userCanControlNotePermission = (authorControlNotes && note.user_id === user?.id) || deckOwner === user?.id;

  useEffect(() => {
    const initPermission = async () => {
      const { data: deckSettings } = await supabase.from<Deck>('decks').select('author_control_notes').eq('id', deckId).single();
      if (deckSettings) setAuthorControlNotes(deckSettings.author_control_notes);
    };
    initPermission();
  }, [deckId]);

  const toggleAuthorOnly = async (newSetting: boolean) => {
    store.getState().updateNote({ id: note.id, author_only: newSetting });
    await supabase.from<Note>('notes').update({ author_only: newSetting }).eq('id', note.id);
    toast.success('Permissions updated!');
  };

  const renderNotePermission = () =>
    note.author_only ? (
      <DropdownItem
        disabled={isOffline}
        className="border-t dark:border-gray-700"
        onClick={async () => await toggleAuthorOnly(false)}
      >
        <IconPencil size={18} className="mr-1" />
        <span>Allow editing</span>
      </DropdownItem>
    ) : (
      <DropdownItem
        disabled={isOffline}
        className="border-t dark:border-gray-700"
        onClick={async () => await toggleAuthorOnly(true)}
      >
        <IconEye size={18} className="mr-1" />
        <span>Restrict editing</span>
      </DropdownItem>
    );

  if (!userCanEditNote) return null;

  return (
    <>
      {userCanControlNotePermission && renderNotePermission()}
      {onPublishClick && (
        <DropdownItem
          disabled={isOffline}
          className={`${!userCanControlNotePermission && 'border-t dark:border-gray-700'}`}
          onClick={onPublishClick}
        >
          <IconSend size={18} className="mr-1" />
          <span>Publish</span>
        </DropdownItem>
      )}
      <DropdownItem disabled={isOffline} onClick={onMoveToClick}>
        <IconCornerDownRight size={18} className="mr-1" />
        <span>Move to</span>
      </DropdownItem>
      <DropdownItem disabled={isOffline} onClick={onDeleteClick}>
        <IconTrash size={18} className="mr-1" />
        <span>Delete</span>
      </DropdownItem>
    </>
  );
}
