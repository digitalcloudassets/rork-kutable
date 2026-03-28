import { getAdminClient } from '../lib/supabase';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const snapshot = {
    supabase: { ok: false, message: '' as string | undefined },
    counts: {
      barbers: null as number | null,
      services: null as number | null,
      bookings7d: null as number | null,
      blocks7d: null as number | null,
      gallery: null as number | null
    },
    stripe: {
      keysLoaded: !!process.env.STRIPE_SECRET_KEY,
      connectedAccounts: 0,
      exampleConnected: null as string | null
    },
    endpoints: {
      services_list: undefined as boolean | undefined,
      availability_openSlots: undefined as boolean | undefined,
      bookings_create: undefined as boolean | undefined
    },
    timestamp: new Date().toISOString()
  };

  // Test Supabase connection
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('barbers').select('id').limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, but connection works
      snapshot.supabase = { ok: true, message: 'Connected (tables may not exist)' };
    } else if (error) {
      snapshot.supabase = { ok: false, message: error.message };
    } else {
      snapshot.supabase = { ok: true, message: undefined };
    }

    // Get counts if connection works
    if (snapshot.supabase.ok) {
      const tables = ['barbers', 'services', 'bookings', 'availability_blocks', 'gallery_items'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            if (table === 'barbers') snapshot.counts.barbers = count || 0;
            if (table === 'services') snapshot.counts.services = count || 0;
            if (table === 'bookings') {
              // Get bookings from last 7 days
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const { count: recentCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());
              snapshot.counts.bookings7d = recentCount || 0;
            }
            if (table === 'availability_blocks') {
              // Get blocks from last 7 days
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const { count: recentCount } = await supabase
                .from('availability_blocks')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());
              snapshot.counts.blocks7d = recentCount || 0;
            }
            if (table === 'gallery_items') snapshot.counts.gallery = count || 0;
          }
        } catch {
          // Table doesn't exist or other error, leave as null
        }
      }

      // Check Stripe connected accounts
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const { data: barbers } = await supabase
            .from('barbers')
            .select('connected_account_id')
            .not('connected_account_id', 'is', null);
          
          if (barbers) {
            const connectedAccounts = barbers.filter(b => 
              b.connected_account_id && b.connected_account_id.startsWith('acct_')
            );
            snapshot.stripe.connectedAccounts = connectedAccounts.length;
            if (connectedAccounts.length > 0) {
              snapshot.stripe.exampleConnected = connectedAccounts[0].connected_account_id;
            }
          }
        } catch {
          // Barbers table might not exist
        }
      }
    }
  } catch (err) {
    snapshot.supabase = { 
      ok: false, 
      message: err instanceof Error ? err.message : 'Connection failed' 
    };
  }

  // Test endpoints with short timeouts
  const testEndpoint = async (url: string, options: any = {}) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  };

  // Helper to get base URL
  const getBaseUrl = () => {
    const fromEnv = process.env.APP_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    try {
      const u = new URL(req.url);
      return `${u.protocol}//${u.host}`;
    } catch {
      return process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
    }
  };
  
  const baseUrl = getBaseUrl();

  // Test key endpoints
  try {
    snapshot.endpoints.services_list = await testEndpoint(`${baseUrl}/api/services/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'demo' })
    });

    snapshot.endpoints.availability_openSlots = await testEndpoint(
      `${baseUrl}/api/availability/open-slots?barberId=demo&serviceId=demo&date=2099-01-01`
    );

    snapshot.endpoints.bookings_create = await testEndpoint(`${baseUrl}/api/bookings/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'demo', serviceId: 'demo', date: '2099-01-01', time: '10:00' })
    });
  } catch {
    // Endpoint tests failed, leave as undefined
  }

  return new Response(
    JSON.stringify(snapshot),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}