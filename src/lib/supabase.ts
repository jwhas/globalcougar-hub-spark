import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env;
const supabaseUrl: string = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);