import { createClient } from '@supabase/supabase-js';

function pick(...names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return v.trim();
  }
  return '';
}

export const SUPABASE_URL =
  pick('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');

export const SUPABASE_SERVICE_KEY =
  pick('SUPABASE_SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY');

export function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase env not configured', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_KEY,
    });
    return null;
  }
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
}

export function getSupabaseHost() {
  try { return new URL(SUPABASE_URL).host; } catch { return 'unknown'; }
}

export default getAdminClient;