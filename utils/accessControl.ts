import { sealData } from 'iron-session';
import supabase from 'lib/supabase';
import { User, Deck } from 'types/supabase';
import { decryptWithLit } from 'utils/encryption';

export async function checkProtectedPageAuth(
  deckId: string | string[] | undefined,
  user: User | undefined,
  allowedDeck: string | undefined,
) {
  if (!deckId || typeof deckId !== 'string') {
    return false;
  } else if (!user) {
    return false;
  } else if (allowedDeck === deckId) {
    return true;
  } else {
    const res = await fetch(`${process.env.BASE_URL}/api/deck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deckId }),
    });
    const { deck } = await res.json();

    if (deck && deck.user_id === user.id) {
      return true;
    } else {
      return false;
    }
  }
}

export async function verifyDeckAccess(deckId: string) {
  try {
    const { data, error } = await supabase.from<Deck>('decks').select('access_params').eq('id', deckId).single();

    if (!data || error) throw new Error('Unable to verify access');

    const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = data.access_params;
    const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);

    if (!deckKey) throw new Error('Unable to verify access');

    const seal = await sealData(
      { allowedDeck: deckId },
      { password: process.env.NEXT_PUBLIC_COOKIE_PASSWORD as string, ttl: 30 },
    );
    const res = await fetch('/api/verify-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ seal }),
    });

    if (!res.ok) throw new Error('Unable to verify access');

    return true;
  } catch (error) {
    return false;
  }
}
