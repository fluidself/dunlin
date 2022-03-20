import { store } from 'lib/store';
import supabase from 'lib/supabase';
import type { Note, Deck } from 'types/supabase';

export default async function deleteNote(noteId: string, deckId: string) {
  // Update note titles in sidebar
  store.getState().deleteNote(noteId);

  const response = await supabase.from<Note>('notes').delete().eq('id', noteId);

  await supabase.from<Deck>('decks').update({ note_tree: store.getState().noteTree }).eq('id', deckId);

  return response;
}
