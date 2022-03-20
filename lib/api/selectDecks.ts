import supabase from 'lib/supabase';
import type { Deck } from 'types/supabase';

export default async function selectDecks(userId: string | undefined) {
  const { data, error } = await supabase.from<Deck>('decks').select('*').eq('user_id', userId).order('id');

  if (error) throw error.message;

  return data;
}
