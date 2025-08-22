import { createClient } from '@supabase/supabase-js';
import { resolveEnv, supabaseHost, Bindings } from './env';

export function getAdminClient(bindings?: Bindings) {
  const { supabaseUrl, supabaseServiceKey } = resolveEnv(bindings);
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase env not configured', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
}

export function getSupabaseHost(bindings?: Bindings) {
  const { supabaseUrl } = resolveEnv(bindings);
  return supabaseHost(supabaseUrl);
}

export default getAdminClient;