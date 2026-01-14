import { createClient } from '@supabase/supabase-js';

// Handle various naming conventions from Vercel integrations
const supabaseUrl = String(process.env.SUPABASE_URL || '');
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing or incomplete.\n' +
    'URL: ' + (supabaseUrl ? 'Detected' : 'Missing') + '\n' +
    'Key: ' + (supabaseAnonKey ? 'Detected' : 'Missing')
  );
}

// Initialize only if keys are present and valid
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Sign up a new teacher with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Cloud services not configured. Please check your Vercel Environment Variables (SUPABASE_URL and SUPABASE_ANON_KEY).");
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
  if (!supabase) throw new Error("Cloud services not configured. Please check your Vercel Environment Variables (SUPABASE_URL and SUPABASE_ANON_KEY).");
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