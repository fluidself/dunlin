import supabase from 'lib/supabase';
import type { Deck } from 'types/supabase';

type DeckInsert = {
  user_id: string;
  deck_name?: string;
};

export default async function insertDeck(deck: DeckInsert) {
  const { data, error } = await supabase.from<Deck>('decks').insert(deck).single();

  if (data) {
    return data;
  } else if (error) {
    console.error(error);
  }
}
