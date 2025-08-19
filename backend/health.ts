import { getAdminClient } from './lib/supabase';

/**
 * Health check endpoint to verify Supabase connection
 * Performs a simple SELECT 1 query to test database connectivity
 */
export async function healthCheck(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();
    
    // Simple query to test connection
    const { error } = await supabase
      .from('barbers')
      .select('count')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is fine
      console.error('Health check failed:', error);
      return { ok: false, error: error.message };
    }
    
    return { ok: true };
  } catch (error) {
    console.error('Health check error:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export default healthCheck;