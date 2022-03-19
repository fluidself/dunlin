import { User } from 'types/supabase';

export default async function checkProtectedPageAuth(
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
