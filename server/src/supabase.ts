import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(url, anon, { auth: { persistSession: false } });

export const supabaseAdmin = createClient(url, service, { auth: { persistSession: false } });
