import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

// Import API handlers (only those with default exports)
import stripeCreateOrFetchAccount from './api/stripe/create-or-fetch-account';
import stripeAccountLink from './api/stripe/account-link';
import stripeAccountStatus from './api/stripe/account-status';
import servicesList from './api/services/list';
import servicesUpsert from './api/services/upsert';
import servicesDelete from './api/services/delete';
import availabilityList from './api/availability/list';
import availabilityBlock from './api/availability/block';
import availabilityUnblock from './api/availability/unblock';
import availabilityOpenSlots from './api/availability/open-slots';
import { POST as barbersSearch } from './api/barbers/search';
import earningsSummary from './api/earnings/summary';
import payoutsList from './api/payouts/list';
import bookingsCreate from './api/bookings/create';
import bookingsList from './api/bookings/list';
import bookingsCancel from './api/bookings/cancel';
import bookingsReschedule from './api/bookings/reschedule';
import paymentsCreateIntent from './api/payments/create-intent';
import paymentsWebhook from './api/payments/webhook';
import galleryList from './api/gallery/list';
import galleryDelete from './api/gallery/delete';
import galleryUpload from './api/gallery/upload';

const app = new Hono();

// helper: base URL
function baseUrlFrom(req: Request) {
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
    supabaseUrl: !!process.env.SUPABASE_URL,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE || !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeSecret: !!process.env.STRIPE_SECRET_KEY,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    platformFeeBps: !!process.env.PLATFORM_FEE_BPS,
    platformFeeFlatCents: !!process.env.PLATFORM_FEE_FLAT_CENTS,
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
    const { error } = await supabase.from('barbers').select('id').limit(1);
    if (error && (error as any).code === '42P01') {
      snapshot.supabase = { ok: true, message: 'Connected (tables may not exist)' };
    } else if (error) {
      snapshot.supabase = { ok: false, message: error.message };
    } else {
      snapshot.supabase = { ok: true, message: undefined };
    }

    if (snapshot.supabase.ok) {
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

  const BASE = baseUrlFrom(c.req.raw);
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

// Stripe endpoints
app.post('/api/stripe/create-or-fetch-account', async (c) => {
  return await stripeCreateOrFetchAccount(c.req.raw);
});

app.post('/api/stripe/account-link', async (c) => {
  return await stripeAccountLink(c.req.raw);
});

app.get('/api/stripe/account-status', async (c) => {
  return await stripeAccountStatus(c.req.raw);
});

// Services endpoints
app.post('/api/services/list', async (c) => {
  return await servicesList(c.req.raw, null);
});

app.post('/api/services/upsert', async (c) => {
  return await servicesUpsert(c.req.raw, null);
});

app.post('/api/services/delete', async (c) => {
  return await servicesDelete(c.req.raw, null);
});

// Availability endpoints
app.post('/api/availability/list', async (c) => {
  return await availabilityList(c.req.raw);
});

app.post('/api/availability/block', async (c) => {
  return await availabilityBlock(c.req.raw);
});

app.post('/api/availability/unblock', async (c) => {
  return await availabilityUnblock(c.req.raw);
});

app.get('/api/availability/open-slots', async (c) => {
  return await availabilityOpenSlots(c.req.raw);
});

// Barbers endpoints
app.post('/api/barbers/search', async (c) => {
  return await barbersSearch(c.req.raw);
});

// Earnings endpoints
app.get('/api/earnings/summary', async (c) => {
  return await earningsSummary(c.req.raw);
});

// Payouts endpoints
app.get('/api/payouts/list', async (c) => {
  return await payoutsList(c.req.raw);
});



// Bookings endpoints
app.post('/api/bookings/create', async (c) => {
  return await bookingsCreate(c.req.raw, null);
});

app.post('/api/bookings/list', async (c) => {
  return await bookingsList(c.req.raw, null);
});

app.post('/api/bookings/cancel', async (c) => {
  return await bookingsCancel(c.req.raw, null);
});

app.post('/api/bookings/reschedule', async (c) => {
  return await bookingsReschedule(c.req.raw, null);
});

// Payments endpoints
app.post('/api/payments/create-intent', async (c) => {
  return await paymentsCreateIntent(c.req.raw, null);
});

app.post('/api/payments/webhook', async (c) => {
  return await paymentsWebhook(c.req.raw, null);
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

// Stripe onboarding landing pages
app.get('/api/stripe/onboarding/return', (c) => {
  return c.text('Onboarding complete. You can close this window and return to the app.');
});

app.get('/api/stripe/onboarding/refresh', (c) => {
  return c.text('Please retry onboarding from the app.');
});

export default app;