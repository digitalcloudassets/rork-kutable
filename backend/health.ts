import { getAdminClient } from './lib/supabase';

/**
 * Simple health check endpoint to verify Supabase connection
 * For comprehensive health check, use /backend/health/full.ts
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

/**
 * HTTP handler for the simple health check
 */
export default async function handler(req: Request): Promise<Response> {
  const result = await healthCheck();
  
  return new Response(
    JSON.stringify(result),
    { 
      status: result.ok ? 200 : 503, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}