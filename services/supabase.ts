import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string) => {
  // Try all possible variations used by different deployment platforms
  const val = process.env[name] || 
              process.env[`NEXT_PUBLIC_${name}`] || 
              process.env[`VITE_${name}`];
              
  return (val && val !== 'undefined' && val !== 'null') ? String(val).trim() : '';
};

export const supabaseUrl = getEnv('SUPABASE_URL');
export const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const getMissingConfigInfo = () => {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  
  const hints = [];
  if (supabaseAnonKey && (supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.length < 50)) {
    hints.push("The Key you provided looks wrong. It should start with 'ey' and be very long.");
  }
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    hints.push("The URL must start with 'https://'.");
  }
  
  return { missing, hints };
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 50 // Standard Supabase anon keys are very long JWTs
);

// Initialize only if keys are present and valid
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