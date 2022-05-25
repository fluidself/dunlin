import supabase from 'lib/supabase';
import type { Deck } from 'types/supabase';
import { AccessControlCondition } from 'types/lit';

type DeckInsert = {
  user_id: string;
  details: {
    encrypted_string: string;
    encrypted_symmetric_key: string;
    access_control_conditions: AccessControlCondition[];
  };
};

export default async function insertDeck(deck: DeckInsert) {
  const { data, error } = await supabase.from<Deck>('decks').insert(deck).single();

  if (data) {
    return data;
  } else if (error) {
    console.error(error);
  }
}
