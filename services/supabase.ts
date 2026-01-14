import { createClient } from '@supabase/supabase-js';

// IMPORTANT: We must use static property access so the build tool (Vite) 
// can replace these with the actual values you put in Vercel.
export const supabaseUrl = process.env.SUPABASE_URL || '';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const getMissingConfigInfo = () => {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  
  const hints = [];
  if (supabaseAnonKey && (supabaseAnonKey.length < 20)) {
    hints.push("The Key looks too short. Ensure you copied the 'anon' 'public' key.");
  }
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    hints.push("The URL must start with 'https://'.");
  }
  
  return { missing, hints };
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.length > 10 &&
  supabaseUrl.startsWith('https://')
);

// Initialize only if keys are present and valid
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Database not connected. Please check your Vercel settings.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Database not connected. Please check your Vercel settings.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};