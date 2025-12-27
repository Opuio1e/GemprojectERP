/// <reference types="vite/client" />

interface RuntimeSupabaseConfig {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
}

interface Window {
  __SUPABASE__?: RuntimeSupabaseConfig;
}
