import { getAdminClient } from '../lib/supabase';
import Stripe from 'stripe';

interface HealthCheckResult {
  supabase: { ok: boolean; message: string };
  tables: {
    barbers: boolean;
    services: boolean;
    bookings: boolean;
    availability_blocks: boolean;
    gallery_items: boolean;
  };
  stripe: {
    keysLoaded: boolean;
    connectedAccountFound: boolean;
    chargesEnabled: boolean | null;
    payoutsEnabled: boolean | null;
  };
  endpoints: {
    'services.list': boolean;
    'availability.list': boolean;
    'availability.openSlots': boolean;
    'bookings.create': boolean;
    'payments.createIntent': boolean;
    'gallery.list': boolean;
    'analytics.summary': boolean;
  };
  version: {
    commit: string | null;
    buildTime: string;
  };
}

/**
 * Check Supabase connection and basic functionality
 */
async function checkSupabase(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = getAdminClient();
    
    // Simple query to test connection
    const { error } = await supabase
      .rpc('version')
      .single();
    
    if (error) {
      // Fallback to a simple select if version() RPC doesn't exist
      const { error: fallbackError } = await supabase
        .from('barbers')
        .select('count')
        .limit(1);
      
      if (fallbackError && fallbackError.code !== 'PGRST116') {
        return { ok: false, message: `Supabase connection failed: ${fallbackError.message}` };
      }
    }
    
    return { ok: true, message: 'Connected successfully' };
  } catch (error) {
    return { 
      ok: false, 
      message: error instanceof Error ? error.message : 'Unknown Supabase error' 
    };
  }
}

/**
 * Check if required database tables exist and are accessible
 */
async function checkTables(): Promise<HealthCheckResult['tables']> {
  const supabase = getAdminClient();
  const tables = ['barbers', 'services', 'bookings', 'availability_blocks', 'gallery_items'];
  const results: Record<string, boolean> = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      results[table] = !error || error.code === 'PGRST116'; // PGRST116 = no rows, which is fine
    } catch (error) {
      console.error(`Table check failed for ${table}:`, error);
      results[table] = false;
    }
  }
  
  return results as HealthCheckResult['tables'];
}

/**
 * Check Stripe configuration and connected accounts
 */
async function checkStripe(): Promise<HealthCheckResult['stripe']> {
  const result: HealthCheckResult['stripe'] = {
    keysLoaded: false,
    connectedAccountFound: false,
    chargesEnabled: null,
    payoutsEnabled: null,
  };
  
  // Check if Stripe keys are loaded
  result.keysLoaded = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
  
  if (!result.keysLoaded) {
    return result;
  }
  
  try {
    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    
    const supabase = getAdminClient();
    
    // Check if any barber has a connected account
    const { data: barbers, error } = await supabase
      .from('barbers')
      .select('connected_account_id')
      .not('connected_account_id', 'is', null)
      .limit(1);
    
    if (!error && barbers && barbers.length > 0) {
      result.connectedAccountFound = true;
      
      // Check account status with real Stripe API
      const accountId = barbers[0].connected_account_id;
      if (accountId && accountId.startsWith('acct_')) {
        try {
          const account = await stripe.accounts.retrieve(accountId);
          result.chargesEnabled = account.charges_enabled;
          result.payoutsEnabled = account.payouts_enabled;
        } catch (stripeError) {
          console.error('Stripe account retrieval error:', stripeError);
          // If account doesn't exist or is invalid, mark as false
          result.chargesEnabled = false;
          result.payoutsEnabled = false;
        }
      }
    }
  } catch (error) {
    console.error('Stripe check error:', error);
  }
  
  return result;
}

/**
 * Test internal API endpoints
 */
async function checkEndpoints(): Promise<HealthCheckResult['endpoints']> {
  const results: HealthCheckResult['endpoints'] = {
    'services.list': false,
    'availability.list': false,
    'availability.openSlots': false,
    'bookings.create': false,
    'payments.createIntent': false,
    'gallery.list': false,
    'analytics.summary': false,
  };
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  // Test services.list
  try {
    const response = await fetch(`${baseUrl}/api/services/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'test-id' }),
      signal: AbortSignal.timeout(5000),
    });
    results['services.list'] = response.status < 500; // Accept 4xx as \"working but invalid input\"
  } catch (error) {
    console.error('services.list check failed:', error);
  }
  
  // Test availability.list
  try {
    const response = await fetch(`${baseUrl}/api/availability/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'test-id' }),
      signal: AbortSignal.timeout(5000),
    });
    results['availability.list'] = response.status < 500;
  } catch (error) {
    console.error('availability.list check failed:', error);
  }
  
  // Test availability.openSlots
  try {
    const response = await fetch(`${baseUrl}/api/availability/open-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        barberId: 'test-id',
        serviceId: 'test-service',
        startDate: new Date().toISOString().split('T')[0]
      }),
      signal: AbortSignal.timeout(5000),
    });
    results['availability.openSlots'] = response.status < 500;
  } catch (error) {
    console.error('availability.openSlots check failed:', error);
  }
  
  // Test gallery.list
  try {
    const response = await fetch(`${baseUrl}/api/gallery/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'test-id' }),
      signal: AbortSignal.timeout(5000),
    });
    results['gallery.list'] = response.status < 500;
  } catch (error) {
    console.error('gallery.list check failed:', error);
  }
  
  // Test analytics.summary
  try {
    const response = await fetch(`${baseUrl}/api/analytics/summary`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    results['analytics.summary'] = response.status < 500;
  } catch (error) {
    console.error('analytics.summary check failed:', error);
  }
  
  // Note: bookings.create and payments.createIntent would require more complex setup
  // For now, mark them as false since they're not easily testable without valid data
  results['bookings.create'] = false;
  results['payments.createIntent'] = false;
  
  return results;
}

/**
 * Get version information
 */
function getVersionInfo(): HealthCheckResult['version'] {
  return {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    buildTime: new Date().toISOString(),
  };
}

/**
 * Comprehensive health check endpoint
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    console.log('Starting comprehensive health check...');
    
    // Run all checks in parallel for better performance
    const [supabaseResult, tablesResult, stripeResult, endpointsResult] = await Promise.all([
      checkSupabase(),
      checkTables(),
      checkStripe(),
      checkEndpoints(),
    ]);
    
    const result: HealthCheckResult = {
      supabase: supabaseResult,
      tables: tablesResult,
      stripe: stripeResult,
      endpoints: endpointsResult,
      version: getVersionInfo(),
    };
    
    console.log('Health check completed:', JSON.stringify(result, null, 2));
    
    // Determine overall status code
    const hasFailures = !supabaseResult.ok || 
                       Object.values(tablesResult).some(v => !v) ||
                       Object.values(endpointsResult).some(v => !v);
    
    const statusCode = hasFailures ? 503 : 200;
    
    return new Response(
      JSON.stringify(result, null, 2),
      { 
        status: statusCode, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResult: HealthCheckResult = {
      supabase: { ok: false, message: 'Health check failed to run' },
      tables: {
        barbers: false,
        services: false,
        bookings: false,
        availability_blocks: false,
        gallery_items: false,
      },
      stripe: {
        keysLoaded: false,
        connectedAccountFound: false,
        chargesEnabled: null,
        payoutsEnabled: null,
      },
      endpoints: {
        'services.list': false,
        'availability.list': false,
        'availability.openSlots': false,
        'bookings.create': false,
        'payments.createIntent': false,
        'gallery.list': false,
        'analytics.summary': false,
      },
      version: getVersionInfo(),
    };
    
    return new Response(
      JSON.stringify(errorResult, null, 2),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}