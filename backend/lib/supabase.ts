import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE');
}

/**
 * Get admin Supabase client with service role key
 * This bypasses RLS and should only be used in server-side code
 */
export function getAdminClient() {
  return createClient(supabaseUrl!, supabaseServiceRole!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export default getAdminClient;