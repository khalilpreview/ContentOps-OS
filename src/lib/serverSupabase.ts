import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serverSupabaseClient: SupabaseClient | null = null;

export function getServerSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(url && key && !url.includes('mock-contentops'));
  return { url: url || 'https://mock-contentops.supabase.co', key: key || 'mock-key', isConfigured };
}

export function getServerSupabaseClient(): SupabaseClient {
  if (_serverSupabaseClient) return _serverSupabaseClient;

  const config = getServerSupabaseConfig();
  _serverSupabaseClient = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return _serverSupabaseClient;
}

export const getServerSupabase = getServerSupabaseClient;
