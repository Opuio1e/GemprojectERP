/// <reference types="vite/client" />

interface RuntimeSupabaseConfig {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface Window {
  __SUPABASE__?: RuntimeSupabaseConfig;
}
