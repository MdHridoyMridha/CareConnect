import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing! Check your AI Studio Secrets.');
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
