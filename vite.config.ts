import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process directly from node:process to avoid issues with named exports for cwd
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Use process.cwd() to correctly identify the current working directory for environment variable loading
  const env = loadEnv(mode, process.cwd(), '');
  
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
  const apiKey = env.VITE_API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});