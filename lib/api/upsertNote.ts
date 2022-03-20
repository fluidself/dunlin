import { store } from 'lib/store';
import supabase from 'lib/supabase';
import type { Note, Deck } from 'types/supabase';
import type { PickPartial } from 'types/utils';

export type NoteUpsert = PickPartial<Note, 'id' | 'content' | 'created_at' | 'updated_at'>;

export default async function upsertNote(note: NoteUpsert) {
  const { data, error } = await supabase
    .from<Note>('notes')
    .upsert({ ...note, updated_at: new Date().toISOString() }, { onConflict: 'deck_id, title' })
    .single();

  // Refreshes the list of notes in the sidebar
  if (data) {
    store.getState().upsertNote(data);

    await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', note.deck_id);
  } else if (error) {
    console.error(error);
  }

  return data;
}
