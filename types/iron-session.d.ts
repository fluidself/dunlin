import { SiweMessage } from 'siwe';
import { User, Deck } from 'types/supabase';

declare module 'iron-session' {
  interface IronSessionData {
    siwe?: SiweMessage;
    nonce?: string;
    user?: User;
    recentDeck?: string;
  }
}
