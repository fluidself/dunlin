import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

if (typeof document !== 'undefined') {
  const token = localStorage.getItem('dbToken');
  if (token) supabase.auth.setAuth(token);
}

export default supabase;
