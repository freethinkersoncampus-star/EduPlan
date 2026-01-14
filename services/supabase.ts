
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing. Cloud sync and Authentication will be disabled. ' +
    'Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

// Initialize only if keys are present, otherwise export null
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

/**
 * Sign up a new teacher with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Cloud services not configured.");
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
  if (!supabase) throw new Error("Cloud services not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Legacy Google Login - kept for compatibility if configured
 */
export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Cloud services not configured.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
