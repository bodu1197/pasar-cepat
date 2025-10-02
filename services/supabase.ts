import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// Please replace these placeholder values with your actual Supabase project URL and anon key.
// You can find these in your Supabase project's dashboard under Settings > API.
// Forgetting to do this will cause all database operations to fail.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
