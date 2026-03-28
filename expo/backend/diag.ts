import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();

app.get('/api/health/ping', c => c.json({ ok: true }));

app.get('/api/diag/db', async c => {
  try {
    const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
    const tables = ['barbers', 'clients', 'services', 'availability_blocks', 'bookings', 'gallery_items', 'reviews', 'push_tokens'];
    const out: any = {};
    
    for (const t of tables) {
      try {
        const { count, error } = await db.from(t).select('*', { head: true, count: 'exact' });
        out[t] = error ? null : (count ?? 0);
      } catch (e) {
        out[t] = null;
      }
    }
    
    return c.json({ ok: true, counts: out, ts: new Date().toISOString() });
  } catch (e: any) {
    return c.json({ ok: false, error: e?.message || 'admin connect failed' }, 500);
  }
});

export default app;