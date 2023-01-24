import supabaseClient from 'lib/supabase';
import type { Deck } from 'types/supabase';

export default async function selectDecks(userId?: string, accessToken?: string) {
  if (!userId) return [];

  const supabase = supabaseClient;
  if (accessToken) {
    supabase.auth.setAuth(accessToken);
  }

  const { data, error } = await supabase
    .from<Deck>('decks')
    .select('id, deck_name, user_id, contributors!inner(*)')
    // @ts-ignore
    .eq('contributors.user_id', userId)
    .order('id');

  if (error) throw error.message;

  return data;
}
