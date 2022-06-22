import { DecryptedNote } from 'types/decrypted';
import { getReadableDatetime } from 'utils/date';
import { addEllipsis } from 'utils/string';

type Props = {
  note: DecryptedNote;
};

export default function NoteMetadata(props: Props) {
  const { note } = props;
  return (
    <div className="px-4 py-2 space-y-1 text-xs text-gray-600 border-t dark:border-gray-700 dark:text-gray-400">
      {note.user_id && <p>Created by {addEllipsis(note.user_id)}</p>}
      <p>Created at {getReadableDatetime(note.created_at)}</p>
      <p>Last modified at {getReadableDatetime(note.updated_at)}</p>
    </div>
  );
}
