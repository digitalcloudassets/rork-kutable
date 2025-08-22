import { createClient } from '@supabase/supabase-js';
import { resolveEnv, Bindings } from './env';

export function getAdminClient(bindings?: Bindings) {
  const { supabaseUrl, supabaseServiceKey } = resolveEnv(bindings);
  if (!supabaseUrl || !supabaseServiceKey) return null;
  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return null;
  }
}