import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { User } from 'types/supabase';
import { DecryptedDeck } from 'types/decrypted';
import { NoteTreeItem } from 'lib/store';

const DeckContext = createContext<DecryptedDeck | undefined>(undefined);

function setRecentDeck(deckId: string) {
  const initDeck = async (deckId: string) => {
    const response = await fetch('/api/recent-deck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deckId }),
    });
    if (!response.ok) throw new Error('Could not initiate DECK');

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
