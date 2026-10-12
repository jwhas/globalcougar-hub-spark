import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env;
const supabaseUrl: string = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = env?.VITE_SUPABASE_ANON_KEY || env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Only create the client when credentials exist; otherwise createClient throws and blanks the page.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
