import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fixed: Cast process to any to resolve the missing 'cwd' property error in the TS environment.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(
        env.SUPABASE_URL || 
        env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL || 
        ''
      ),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(
        env.SUPABASE_ANON_KEY || 
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KE || 
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
        process.env.SUPABASE_ANON_KEY || 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
        ''
      )
    }
  };
});