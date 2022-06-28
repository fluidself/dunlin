import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { IconCornerDownRight, IconTrash, IconPencil, IconEye } from '@tabler/icons';
import { toast } from 'react-toastify';
import { DecryptedNote } from 'types/decrypted';
import { Note } from 'types/supabase';
import { DropdownItem } from 'components/Dropdown';
import useDeleteNote from 'utils/useDeleteNote';
import { store } from 'lib/store';
import supabase from 'lib/supabase';

type Props = {
  note: DecryptedNote;
  userCanEditNote: boolean;
  userCanControlNotePermission: boolean;
  setIsMoveToModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function NoteEditMenu(props: Props) {
  const { note, userCanEditNote, userCanControlNotePermission, setIsMoveToModalOpen } = props;

  const onMoveToClick = useCallback(() => setIsMoveToModalOpen(true), [setIsMoveToModalOpen]);
  const onDeleteClick = useDeleteNote(note.id);

  const toggleAuthorOnly = async (newSetting: boolean) => {
    store.getState().updateNote({ id: note.id, author_only: newSetting });
    await supabase.from<Note>('notes').update({ author_only: newSetting }).eq('id', note.id);
    toast.success('Permissions updated!');
  };

  const renderNotePermission = () =>
    note.author_only ? (
      <DropdownItem onClick={async () => await toggleAuthorOnly(false)} className="border-t dark:border-gray-700">
        <IconPencil size={18} className="mr-1" />
        <span>Allow editing</span>
      </DropdownItem>
    ) : (
      <DropdownItem onClick={async () => await toggleAuthorOnly(true)} className="border-t dark:border-gray-700">
        <IconEye size={18} className="mr-1" />
        <span>Make view-only</span>
      </DropdownItem>
    );

  if (!userCanEditNote) return null;

  return (
    <>
      {userCanControlNotePermission && renderNotePermission()}
      <DropdownItem onClick={onDeleteClick} className={`${userCanControlNotePermission ? '' : 'border-t dark:border-gray-700'}`}>
        <IconTrash size={18} className="mr-1" />
        <span>Delete</span>
      </DropdownItem>
      <DropdownItem onClick={onMoveToClick}>
        <IconCornerDownRight size={18} className="mr-1" />
        <span>Move to</span>
      </DropdownItem>
    </>
  );
}
