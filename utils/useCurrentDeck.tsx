import { useEffect, useContext, createContext } from 'react';
import type { ReactNode } from 'react';
import { DecryptedDeck } from 'types/decrypted';

const DeckContext = createContext<DecryptedDeck | undefined>(undefined);

function setRecentDeck(deckId: string) {
  const initDeck = async (deckId: string) => {
    await fetch('/api/recent-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deckId }),
    });

    return;
  };

  useEffect(() => {
    initDeck(deckId);
  }, []);
}

export function ProvideCurrentDeck({ children, deck }: { children: ReactNode; deck?: DecryptedDeck }) {
  if (deck?.id) {
    setRecentDeck(deck.id);
  }

  return <DeckContext.Provider value={deck}>{children}</DeckContext.Provider>;
}

export const useCurrentDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useCurrentDeck must be used within a provider');
  }
  return context;
};
