import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We use '' to load ALL variables, even those without VITE_ prefix
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Combine process.env (system) and env (file-based)
  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // We explicitly define these so they are "baked in" during the Vercel build
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    }
  };
});