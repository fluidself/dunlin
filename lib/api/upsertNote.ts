import { v4 as uuidv4 } from 'uuid';
import { store } from 'lib/store';
import supabase from 'lib/supabase';
import type { Note, Deck } from 'types/supabase';
import type { DecryptedNote } from 'types/decrypted';
import type { PickPartial } from 'types/utils';
import { encryptNote } from 'utils/encryption';

export type NoteUpsert = PickPartial<DecryptedNote, 'id' | 'created_at' | 'updated_at'>;

export default async function upsertNote(noteUpsert: NoteUpsert, key: string) {
  const note = {
    ...noteUpsert,
    id: noteUpsert.id ?? uuidv4(),
    created_at: noteUpsert.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.getState().upsertNote(note);

  const encryptedNote = encryptNote(note, key);
  await supabase.from<Note>('notes').upsert(encryptedNote).single();
  await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', note.deck_id);

  return note;
}
