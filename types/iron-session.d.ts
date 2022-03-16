import { SiweMessage } from 'siwe';
import { User } from 'types/supabase';

declare module 'iron-session' {
  interface IronSessionData {
    siwe?: SiweMessage;
    nonce?: string;
    user?: User;
    allowedDeck?: string;
  }
}
