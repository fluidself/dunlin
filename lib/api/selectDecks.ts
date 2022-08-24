import supabase from 'lib/supabase';
import type { Deck } from 'types/supabase';

export default async function selectDecks(userId?: string) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from<Deck>('decks')
    .select('id, deck_name, user_id, contributors!inner(*)')
    // @ts-ignore
    .eq('contributors.user_id', userId)
    .order('id');

  if (error) throw error.message;

  return data;
}
