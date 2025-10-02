import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
