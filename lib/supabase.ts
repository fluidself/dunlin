import { createClient } from '@supabase/supabase-js';

const URL = (
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL_ALT
    : process.env.NEXT_PUBLIC_SUPABASE_URL
) as string;
const KEY = (
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_SUPABASE_KEY_ALT
    : process.env.NEXT_PUBLIC_SUPABASE_KEY
) as string;

const supabase = createClient(URL, KEY);

if (typeof document !== 'undefined') {
  const token = localStorage.getItem('dbToken');
  if (token) supabase.auth.setAuth(token);
}

export default supabase;
