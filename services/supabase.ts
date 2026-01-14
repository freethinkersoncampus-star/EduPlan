import { createClient } from '@supabase/supabase-js';

// We look for every possible variation of the names, including the truncated one in the user's screenshot
const supabaseUrl = String(
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  ''
).trim();

const supabaseAnonKey = String(
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KE || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 // Basic check to ensure it's a real key
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing or incomplete.\n' +
    'URL Status: ' + (supabaseUrl && supabaseUrl !== 'undefined' ? 'Found' : 'Missing') + '\n' +
    'Key Status: ' + (supabaseAnonKey && supabaseAnonKey !== 'undefined' ? 'Found' : 'Missing')
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
  if (!supabase) throw new Error("Cloud services not configured. Please check your Vercel Environment Variables.");
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
  if (!supabase) throw new Error("Cloud services not configured. Please check your Vercel Environment Variables.");
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