import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // We combine variables from .env files and the system environment (like Vercel)
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(
        env.SUPABASE_URL || 
        env.VITE_SUPABASE_URL || 
        process.env.SUPABASE_URL || 
        ''
      ),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(
        env.SUPABASE_ANON_KEY || 
        env.VITE_SUPABASE_ANON_KEY || 
        process.env.SUPABASE_ANON_KEY || 
        ''
      )
    }
  };
});