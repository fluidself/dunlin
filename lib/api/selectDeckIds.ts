import supabase from 'lib/supabase';
import type { Deck, User } from 'types/supabase';

export default async function selectDeckIds(user: User) {
  if (!user) return [];
  const { data, error } = await supabase.from<Deck>('decks').select('id').eq('user_id', user.id).order('id');

  if (error) throw error.message;

  return [...data.map(deck => deck.id), ...user.joined_decks];
}
