import { createClient } from '@supabase/supabase-js';

/**
 * We look for the keys in process.env (which Vite replaces during build).
 * If the strings are empty, it means the keys weren't found during the Vercel build.
 */
export const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
export const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

export const getMissingConfigInfo = () => {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  
  const hints = [];
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    hints.push("The URL is missing 'https://' at the start.");
  }
  if (supabaseAnonKey && supabaseAnonKey.length < 50) {
    hints.push("The Key looks too short. Make sure you copied the full 'anon' key.");
  }
  
  return { missing, hints };
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

// Initialize client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Database not connected.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Database not connected.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};