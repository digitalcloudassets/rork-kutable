import { createClient } from '@supabase/supabase-js';
import { resolveEnv, Bindings } from './env';

export function getAdminClient(b?: Bindings) {
  const { supabaseUrl, supabaseServiceKey } = resolveEnv(b);
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}