import { createClient } from '@supabase/supabase-js';

// 1. First, try the "System" keys (from Vercel build)
const systemUrl = (process.env.SUPABASE_URL || '').trim();
const systemKey = (process.env.SUPABASE_ANON_KEY || '').trim();

// 2. Second, check if there's a manual override in this specific browser
const getUrl = () => {
  if (systemUrl && systemUrl.startsWith('https://')) return systemUrl;
  return (localStorage.getItem('eduplan_manual_url') || '').trim();
};

const getKey = () => {
  if (systemKey && systemKey.length > 20) return systemKey;
  return (localStorage.getItem('eduplan_manual_key') || '').trim();
};

export const supabaseUrl = getUrl();
export const supabaseAnonKey = getKey();

export const saveManualConfig = (url: string, key: string) => {
  localStorage.setItem('eduplan_manual_url', url.trim());
  localStorage.setItem('eduplan_manual_key', key.trim());
  window.location.reload(); 
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

// Only counts as manual if we didn't find system keys
export const isUsingManualConfig = Boolean(!systemUrl && localStorage.getItem('eduplan_manual_url'));
export const hasSystemConfig = Boolean(systemUrl && systemKey);

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