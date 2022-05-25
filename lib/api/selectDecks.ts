import supabase from 'lib/supabase';
import type { Deck } from 'types/supabase';
import { store } from 'lib/store';

export default async function selectDecks(userId?: string) {
  if (!userId) return [];
  const { data, error } = await supabase.from<Deck>('decks').select('*').eq('user_id', userId).order('id');

  if (error) throw error.message;

  if (store.getState().allowedDeck) {
    const { data: additionalDeck, error } = await supabase
      .from<Deck>('decks')
      .select('*')
      .eq('id', store.getState().allowedDeck)
      .single();

    if (error) throw error.message;
    data.push(additionalDeck);
  }

  return data;
}
