import supabase from 'lib/supabase';
import type { Deck, User } from 'types/supabase';

export default async function selectDecks(user: User | null) {
  if (!user) return [];
  const { data, error } = await supabase.from<Deck>('decks').select('id, deck_name').eq('user_id', user.id).order('id');

  if (!data || error) throw error.message;

  for (const deckId of user.joined_decks) {
    const { data: joinedDeck, error } = await supabase.from<Deck>('decks').select('id, deck_name').eq('id', deckId).single();
    if (error) throw error.message;

    data.push(joinedDeck);
  }

  return data;
}
