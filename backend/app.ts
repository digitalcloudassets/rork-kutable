import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAdminClient } from './lib/supabase';
import stripe from './stripe';
import availability from './availability';
import services from './services';
import diag from './diag';

// Import API handlers (only those with default exports)
import { POST as barbersSearch } from './api/barbers/search';
import { GET as barbersProfile } from './api/barbers/profile';
import earningsSummary from './api/earnings/summary';
import payoutsList from './api/payouts/list';
import bookings from './bookings';
import paymentsCreateIntent from './api/payments/create-intent';
import paymentsWebhook from './api/payments/webhook';
import galleryList from './api/gallery/list';
import galleryDelete from './api/gallery/delete';
import galleryUpload from './api/gallery/upload';
import reviewsApi from './api/reviews/index';

const app = new Hono();

// Allow mobile app to call API
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
}));

// helper: base URL
function getBaseUrl(req: Request) {
  const fromEnv = process.env.APP_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  try {
    const u = new URL(req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

// GET /api/health/ping
app.get('/api/health/ping', (c) => c.json({ ok: true, time: new Date().toISOString() }));

// GET /api/health/env
app.get('/api/health/env', (c) => {
  return c.json({
    appBaseUrl: !!process.env.APP_BASE_URL,
    supabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL),
    serviceRole: !!(process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
    stripeSecret: !!process.env.STRIPE_SECRET_KEY,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    platformFeeBps: !!process.env.PLATFORM_FEE_BPS,
    platformFeeFlatCents: !!process.env.PLATFORM_FEE_FLAT_CENTS,
    envDetails: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_URL: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    }
  });
});

// GET /api/health/snapshot
app.get('/api/health/snapshot', async (c) => {
  const snapshot = {
    supabase: { ok: false as boolean, message: undefined as string | undefined },
    counts: {
      barbers: null as number | null,
      services: null as number | null,
      bookings7d: null as number | null,
      blocks7d: null as number | null,
      gallery: null as number | null,
    },
    stripe: {
      keysLoaded: !!process.env.STRIPE_SECRET_KEY,
      connectedAccounts: 0,
      exampleConnected: null as string | null,
    },
    endpoints: {
      services_list: undefined as boolean | undefined,
      availability_openSlots: undefined as boolean | undefined,
      bookings_create: undefined as boolean | undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Supabase connectivity + counts
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      snapshot.supabase = { ok: false, message: 'Supabase client not configured' };
    } else {
      const { error } = await supabase.from('barbers').select('id').limit(1);
      if (error && (error as any).code === '42P01') {
        snapshot.supabase = { ok: true, message: 'Connected (tables may not exist)' };
      } else if (error) {
        snapshot.supabase = { ok: false, message: error.message };
      } else {
        snapshot.supabase = { ok: true, message: undefined };
      }
    }

    if (snapshot.supabase.ok && supabase) {
      const tables = ['barbers', 'services', 'bookings', 'availability_blocks', 'gallery_items'] as const;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      for (const t of tables) {
        try {
          if (t === 'bookings') {
            const { count } = await supabase.from('bookings')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', sevenDaysAgo);
            snapshot.counts.bookings7d = count ?? 0;
          } else if (t === 'availability_blocks') {
            const { count } = await supabase.from('availability_blocks')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', sevenDaysAgo);
            snapshot.counts.blocks7d = count ?? 0;
          } else {
            const { count } = await supabase.from(t)
              .select('*', { count: 'exact', head: true });
            if (t === 'barbers') snapshot.counts.barbers = count ?? 0;
            if (t === 'services') snapshot.counts.services = count ?? 0;
            if (t === 'gallery_items') snapshot.counts.gallery = count ?? 0;
          }
        } catch { /* table missing — leave null */ }
      }

      // Stripe connected accounts via DB
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const { data: rows } = await supabase
            .from('barbers')
            .select('connected_account_id')
            .not('connected_account_id', 'is', null);
          const list = (rows ?? []).filter(r => r.connected_account_id?.startsWith('acct_'));
          snapshot.stripe.connectedAccounts = list.length;
          snapshot.stripe.exampleConnected = list[0]?.connected_account_id ?? null;
        } catch { /* ignore */ }
      }
    }
  } catch (e: any) {
    snapshot.supabase = { ok: false, message: e?.message ?? 'Connection failed' };
  }

  // Endpoint pings (optional)
  const testEndpoint = async (url: string, init?: RequestInit) => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { ...(init || {}), signal: controller.signal });
      clearTimeout(t);
      return res.ok;
    } catch { return false; }
  };

  const BASE = getBaseUrl(c.req.raw);
  if (BASE) {
    snapshot.endpoints.services_list = await testEndpoint(`${BASE}/api/services/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'demo' }),
    });
    snapshot.endpoints.availability_openSlots =
      await testEndpoint(`${BASE}/api/availability/open-slots?barberId=demo&serviceId=demo&date=2099-01-01`);
    snapshot.endpoints.bookings_create = await testEndpoint(`${BASE}/api/bookings/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId: 'demo', serviceId: 'demo', date: '2099-01-01', time: '10:00' }),
    });
  }

  return c.json(snapshot);
});

// GET /api/health/integration
app.get('/api/health/integration', async (c) => {
  const supa = getAdminClient();
  const stripeIsSet = !!process.env.STRIPE_SECRET_KEY;
  let canQueryBarbers = false;
  try {
    if (supa) {
      const { error } = await supa.from('barbers').select('id').limit(1);
      canQueryBarbers = !error || (error as any).code === 'PGRST116' /* no rows */;
    }
  } catch {}
  return c.json({
    base: getBaseUrl(c.req.raw),
    supabaseConfigured: !!supa,
    stripeConfigured: stripeIsSet,
    canQueryBarbers,
  });
});

// Mount Stripe module
app.route('/', stripe);

// Mount availability module
app.route('/', availability);

// Mount services module
app.route('/', services);

// Mount bookings module
app.route('/', bookings);

// Mount diagnostics module
app.route('/', diag);

// Services endpoints are now handled by the mounted services module

// Availability endpoints are now handled by the mounted availability module

// Bookings endpoints are now handled by the mounted bookings module

// Barbers endpoints
app.post('/api/barbers/search', async (c) => {
  return await barbersSearch(c.req.raw);
});

app.get('/api/barbers/profile', async (c) => {
  return await barbersProfile(c.req.raw);
});

// Earnings endpoints
app.get('/api/earnings/summary', async (c) => {
  const response = await earningsSummary(c.req.raw);
  const data = await response.json();
  c.status(response.status as any);
  return c.json(data);
});

// Payouts endpoints
app.get('/api/payouts/list', async (c) => {
  const response = await payoutsList(c.req.raw);
  const data = await response.json();
  c.status(response.status as any);
  return c.json(data);
});



// Bookings endpoints are now handled by the mounted bookings module

// Payments endpoints
app.post('/api/payments/create-intent', async (c) => {
  return await paymentsCreateIntent(c.req.raw, null);
});

app.post('/api/payments/webhook', async (c) => {
  try {
    const response = await paymentsWebhook(c.req.raw);
    const data = await response.json();
    c.status(response.status as any);
    return c.json(data);
  } catch (error: any) {
    console.error('Error in payments webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Gallery endpoints
app.post('/api/gallery/list', async (c) => {
  return galleryList(c.req.raw);
});

app.post('/api/gallery/delete', async (c) => {
  return galleryDelete(c.req.raw);
});

app.post('/api/gallery/upload', async (c) => {
  return galleryUpload(c.req.raw);
});

// Reviews endpoints
app.route('/api/reviews', reviewsApi);



export default app;