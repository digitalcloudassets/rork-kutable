import { createClient } from '@supabase/supabase-js';

/**
 * Get admin Supabase client with service role key
 * This bypasses RLS and should only be used in server-side code
 * Returns null if environment variables are not configured
 */
export function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  
  if (!supabaseUrl || !supabaseServiceRole) {
    console.warn('Supabase environment variables not configured');
    return null;
  }
  
  try {
    return createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export default getAdminClient;