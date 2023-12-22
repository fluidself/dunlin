import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_KEY as string,
);

if (typeof document !== 'undefined') {
  const token = localStorage.getItem('dbToken');
  if (token) supabase.auth.setAuth(token);
}

export default supabase;
