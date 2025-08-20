import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

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

export default app;