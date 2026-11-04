import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qyekvqxjwecncalfiaef.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZWt2cXhqd2VjbmNhbGZpYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzAzNDgsImV4cCI6MjEwNjgwNjM0OH0.02YDl_sKggpguJ7XHBTrImssufADAcnwPoYtDqK7B1c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});