import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string) => {
  const val = process.env[name];
  return (val && val !== 'undefined' && val !== 'null') ? String(val).trim() : '';
};

export const supabaseUrl = getEnv('SUPABASE_URL');
export const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const getMissingConfigInfo = () => {
  const missing = [];
  if (!supabaseUrl) missing.push("URL (SUPABASE_URL)");
  if (!supabaseAnonKey) missing.push("Key (SUPABASE_ANON_KEY)");
  
  const hints = [];
  if (supabaseAnonKey && supabaseAnonKey.startsWith('sb_')) {
    hints.push("Your Key starts with 'sb_'. Please use the 'anon public' key from Supabase (starts with 'ey').");
  }
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    hints.push("Your URL must start with 'https://'.");
  }
  
  return { missing, hints };
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

// Initialize only if keys are present and valid
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Sign up a new teacher with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Cloud services not configured correctly.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Sign in an existing teacher with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Cloud services not configured correctly.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};