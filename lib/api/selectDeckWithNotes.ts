import supabase from 'lib/supabase';
import type { Deck, Note } from 'types/supabase';

export default async function selectDeckWithNotes(deckId: string) {
  const deckPromise = supabase.from<Deck>('decks').select('*').match({ id: deckId }).single();
  const notesPromise = supabase
    .from<Note>('notes')
    .select('id, title, content, user_id, author_only, created_at, updated_at')
    .eq('deck_id', deckId);
  const [{ data: dbDeck }, { data: dbNotes }] = await Promise.all([deckPromise, notesPromise]);

  if (!dbDeck || !dbNotes) throw new Error('Failed to fetch data');

  return { dbDeck, dbNotes };
}
