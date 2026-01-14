import { createClient } from '@supabase/supabase-js';

// Get keys from either Vercel (process.env) or Manual Local Storage fallback
const getUrl = () => {
  const local = localStorage.getItem('eduplan_manual_url');
  if (local) return local.trim();
  return (process.env.SUPABASE_URL || '').trim();
};

const getKey = () => {
  const local = localStorage.getItem('eduplan_manual_key');
  if (local) return local.trim();
  return (process.env.SUPABASE_ANON_KEY || '').trim();
};

export const supabaseUrl = getUrl();
export const supabaseAnonKey = getKey();

export const saveManualConfig = (url: string, key: string) => {
  localStorage.setItem('eduplan_manual_url', url.trim());
  localStorage.setItem('eduplan_manual_key', key.trim());
  window.location.reload(); // Refresh to apply keys
};

export const clearManualConfig = () => {
  localStorage.removeItem('eduplan_manual_url');
  localStorage.removeItem('eduplan_manual_key');
  window.location.reload();
};

export const getMissingConfigInfo = () => {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  
  const hints = [];
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    hints.push("The URL must start with 'https://'.");
  }
  return { missing, hints };
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const isUsingManualConfig = Boolean(localStorage.getItem('eduplan_manual_url'));

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