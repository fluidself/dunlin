import { SiweMessage } from 'siwe';
import type { User } from 'types/supabase';

declare module 'iron-session' {
  interface IronSessionData {
    siwe?: SiweMessage;
    nonce?: string;
    user?: User;
    dbToken?: string;
    recentDeck?: string;
  }
}
