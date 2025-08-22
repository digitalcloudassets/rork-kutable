import { createClient } from '@supabase/supabase-js';
import { resolveEnv, Bindings } from './env';

export function getAdminClient(bindings?: Bindings) {
  const { supabaseUrl, supabaseServiceKey } = resolveEnv(bindings);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin client: missing URL or service key', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      url: supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'missing'
    });
    return null;
  }
  
  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}