import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

const app = new Hono();
const admin = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

// List blocks (optional range)
app.post('/api/availability/list', async c => {
  const { barberId, startISO, endISO } = await c.req.json();
  if (!barberId) return c.json({ error:'barberId required' }, 400);
  const db = admin();
  let q = db.from('availability_blocks').select('*').eq('barber_id', barberId).order('start_utc', { ascending:true });
  if (startISO) q = q.gte('start_utc', new Date(startISO).toISOString());
  if (endISO)   q = q.lte('end_utc', new Date(endISO).toISOString());
  const { data, error } = await q;
  if (error) return c.json({ error:error.message }, 500);
  return c.json({ blocks: data ?? [] });
});

// Create block (overlap checks vs blocks + bookings)
app.post('/api/availability/block', async c => {
  const { barberId, startISO, endISO, reason } = await c.req.json();
  if (!barberId || !startISO || !endISO) return c.json({ error:'barberId, startISO, endISO required' }, 400);
  const db = admin();
  const start = new Date(startISO).toISOString();
  const end   = new Date(endISO).toISOString();

  const { count: blk } = await db.from('availability_blocks').select('*', { head:true, count:'exact' })
    .eq('barber_id', barberId).lt('start_utc', end).gt('end_utc', start);
  if ((blk ?? 0) > 0) return c.json({ error:'Overlaps with block' }, 409);

  const { count: bks } = await db.from('bookings').select('*', { head:true, count:'exact' })
    .eq('barber_id', barberId).not('status','in','("cancelled","refunded")')
    .lt('start_utc', end).gt('end_utc', start);
  if ((bks ?? 0) > 0) return c.json({ error:'Overlaps with booking' }, 409);

  const { data, error } = await db.from('availability_blocks').insert({
    barber_id: barberId, start_utc: start, end_utc: end, reason: reason ?? null
  }).select('*').single();
  if (error) return c.json({ error:error.message }, 500);
  return c.json({ block: data });
});

// Delete block
app.delete('/api/availability/block/:id', async c => {
  const id = c.req.param('id'); const barberId = c.req.query('barberId');
  if (!id || !barberId) return c.json({ error:'id & barberId required' }, 400);
  const db = admin();
  const { data: row } = await db.from('availability_blocks').select('barber_id').eq('id', id).single();
  if (!row) return c.json({ error:'Not found' }, 404);
  if (row.barber_id !== barberId) return c.json({ error:'Forbidden' }, 403);
  const { error } = await db.from('availability_blocks').delete().eq('id', id);
  if (error) return c.json({ error:error.message }, 500);
  return c.json({ ok:true });
});

// Open slots (09:00–17:00, 30-min grid or service duration)
app.get('/api/availability/open-slots', async c => {
  const barberId = c.req.query('barberId');
  const serviceId = c.req.query('serviceId');
  const dateStr = c.req.query('date'); // YYYY-MM-DD
  if (!barberId || !dateStr) return c.json({ error:'barberId & date required' }, 400);

  const db = admin();
  let duration = 30;
  if (serviceId) {
    const { data: svc } = await db.from('services').select('duration_minutes').eq('id', serviceId).single();
    if (svc?.duration_minutes) duration = svc.duration_minutes;
  }

  // Use local day window in UTC to avoid TZ offset overlap issues
  const startLocal = new Date(`${dateStr}T09:00:00`);
  const endLocal   = new Date(`${dateStr}T17:00:00`);
  const dayStart = new Date(startLocal.getTime() - startLocal.getTimezoneOffset()*60000);
  const dayEnd   = new Date(endLocal.getTime()   - endLocal.getTimezoneOffset()*60000);

  const { data: blocks } = await db.from('availability_blocks').select('start_utc,end_utc')
    .eq('barber_id', barberId).lt('start_utc', dayEnd.toISOString()).gt('end_utc', dayStart.toISOString());
  const { data: books } = await db.from('bookings').select('start_utc,end_utc,status')
    .eq('barber_id', barberId).not('status','in','("cancelled","refunded")')
    .lt('start_utc', dayEnd.toISOString()).gt('end_utc', dayStart.toISOString());

  const step = 30 * 60 * 1000, dur = duration * 60 * 1000;
  const slots:string[] = [];
  for (let t = dayStart.getTime(); t + dur <= dayEnd.getTime(); t += step) {
    const s = new Date(t), e = new Date(t + dur);
    const overlaps = (arr:any[]) => arr?.some(x =>
      new Date(x.start_utc).getTime() < e.getTime() && new Date(x.end_utc).getTime() > s.getTime());
    if (overlaps(blocks || []) || overlaps(books || [])) continue;
    slots.push(s.toISOString());
  }
  return c.json({ slots });
});

export default app;