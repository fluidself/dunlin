import supabase from 'lib/supabase';
import { User, Deck, Contributor } from 'types/supabase';
import { decryptWithLit } from 'utils/encryption';

export async function checkProtectedPageAuth(deckId?: string | string[], userId?: string, allowedDeck?: string) {
  if (typeof deckId !== 'string' || !userId) {
    return false;
  }

  if (allowedDeck === deckId) {
    await supabase.from<Contributor>('contributors').upsert({ deck_id: deckId, user_id: userId });
    return true;
  }

  const { data } = await supabase.from<Contributor>('contributors').select('*').match({ deck_id: deckId, user_id: userId });
  if (data) {
    return true;
  }

  return false;
}

export async function verifyDeckAccess(deckId: string, user: User) {
  try {
    const { data: deck } = await supabase.from<Deck>('decks').select('user_id, access_params').eq('id', deckId).single();
    if (!deck) throw new Error('Unable to verify access');

    if (deck.user_id === user.id) {
      return true;
    }

    const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = deck.access_params;
    const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
    if (!deckKey) throw new Error('Unable to verify access');

    const { data } = await supabase.from<Contributor>('contributors').upsert({ deck_id: deckId, user_id: user.id });
    if (!data) throw new Error('Unable to verify access');

    return true;
  } catch (error) {
    return false;
  }
}
