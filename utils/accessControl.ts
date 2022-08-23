import supabase from 'lib/supabase';
import { User, Deck } from 'types/supabase';
import { decryptWithLit } from 'utils/encryption';

export async function checkProtectedPageAuth(deckId?: string | string[], userId?: string, allowedDeck?: string) {
  if (typeof deckId !== 'string' || !userId) {
    return false;
  }

  // TODO: remove deprecated block
  if (allowedDeck === deckId) {
    const { data: user } = await supabase.from<User>('users').select('joined_decks').eq('id', userId).single();
    const joinedDecks = [...(user?.joined_decks || []), deckId].filter((v, i, a) => a.indexOf(v) === i);

    await supabase.from<User>('users').update({ joined_decks: joinedDecks }).eq('id', userId).single();
    return true;
  }

  const { data: user } = await supabase.from<User>('users').select('joined_decks').eq('id', userId).single();
  if (user?.joined_decks?.includes(deckId)) {
    return true;
  }

  const { data: deck } = await supabase.from<Deck>('decks').select('user_id').eq('id', deckId).single();
  if (deck?.user_id === userId) {
    return true;
  }

  return false;
}

export async function verifyDeckAccess(deckId: string, user: User) {
  try {
    const { data } = await supabase.from<Deck>('decks').select('user_id, access_params').eq('id', deckId).single();

    if (!data) throw new Error('Unable to verify access');

    if (data.user_id === user.id) {
      return true;
    }

    const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = data.access_params;
    const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);

    if (!deckKey) throw new Error('Unable to verify access');

    const joinedDecks = [...(user.joined_decks || []), deckId].filter((v, i, a) => a.indexOf(v) === i);
    const { data: dbUser } = await supabase.from<User>('users').update({ joined_decks: joinedDecks }).eq('id', user.id).single();

    if (!dbUser) throw new Error('Unable to verify access');

    return true;
  } catch (error) {
    return false;
  }
}
