import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

const app = new Hono();

// List blocks (optionally by range)
app.post('/api/availability/list', async c => {
  const { barberId, startISO, endISO } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  let q = supa.from('availability_blocks').select('*').eq('barber_id', barberId).order('start_utc', { ascending: true });
  if (startISO) q = q.gte('start_utc', new Date(startISO).toISOString());
  if (endISO) q = q.lte('end_utc', new Date(endISO).toISOString());
  const { data, error } = await q; 
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ blocks: data ?? [] });
});

// Create block (overlap checks)
app.post('/api/availability/block', async c => {
  const { barberId, startISO, endISO, reason } = await c.req.json();
  if (!barberId || !startISO || !endISO) return c.json({ error: 'barberId, startISO, endISO required' }, 400);
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const start = new Date(startISO).toISOString();
  const end   = new Date(endISO).toISOString();
  
  // overlap bookings (not cancelled/refunded)
  const { count: bookCnt } = await supa.from('bookings').select('*', { count: 'exact', head: true })
    .eq('barber_id', barberId).not('status','in','("cancelled","refunded")').lt('start_utc', end).gt('end_utc', start);
  if ((bookCnt ?? 0) > 0) return c.json({ error: 'Overlaps with booking' }, 409);
  
  // overlap blocks
  const { count: blkCnt } = await supa.from('availability_blocks').select('*', { count: 'exact', head: true })
    .eq('barber_id', barberId).lt('start_utc', end).gt('end_utc', start);
  if ((blkCnt ?? 0) > 0) return c.json({ error: 'Overlaps with block' }, 409);
  
  const { data, error } = await supa.from('availability_blocks').insert({ barber_id: barberId, start_utc: start, end_utc: end, reason: reason ?? null }).select('*').single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ block: data });
});

// Delete block
app.delete('/api/availability/block/:id', async c => {
  const id = c.req.param('id'); 
  const barberId = c.req.query('barberId');
  if (!id || !barberId) return c.json({ error: 'id and barberId required' }, 400);
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const { data: row } = await supa.from('availability_blocks').select('barber_id').eq('id', id).single();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.barber_id !== barberId) return c.json({ error: 'Forbidden' }, 403);
  const { error } = await supa.from('availability_blocks').delete().eq('id', id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// Open slots: simple 30-min grid 09:00–17:00 local, excluding blocks & bookings
app.get('/api/availability/open-slots', async c => {
  const barberId = c.req.query('barberId');
  const serviceId = c.req.query('serviceId'); // optional if you want duration per service later
  const dateStr = c.req.query('date'); // YYYY-MM-DD
  if (!barberId || !dateStr) return c.json({ error: 'barberId and date required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  // get service duration (default 30)
  let duration = 30;
  if (serviceId) {
    const { data: s } = await supa.from('services').select('duration_minutes').eq('id', serviceId).single();
    if (s?.duration_minutes) duration = s.duration_minutes;
  }
  const dayStart = new Date(`${dateStr}T09:00:00.000Z`);
  const dayEnd   = new Date(`${dateStr}T17:00:00.000Z`);

  // fetch blocks & bookings for the day
  const { data: blocks } = await supa.from('availability_blocks').select('start_utc,end_utc')
    .eq('barber_id', barberId).lt('start_utc', dayEnd.toISOString()).gt('end_utc', dayStart.toISOString());
  const { data: books } = await supa.from('bookings').select('start_utc,end_utc,status')
    .eq('barber_id', barberId).not('status','in','("cancelled","refunded")')
    .lt('start_utc', dayEnd.toISOString()).gt('end_utc', dayStart.toISOString());

  // generate grid
  const slots: string[] = [];
  const stepMs = 30 * 60 * 1000;
  const durMs  = duration * 60 * 1000;
  for (let t = dayStart.getTime(); t + durMs <= dayEnd.getTime(); t += stepMs) {
    const s = new Date(t);
    const e = new Date(t + durMs);

    const overlaps = (arr: any[]) => arr?.some(x =>
      new Date(x.start_utc).getTime() < e.getTime() &&
      new Date(x.end_utc).getTime()   > s.getTime()
    );
    if (overlaps(blocks || []) || overlaps(books || [])) continue;

    slots.push(s.toISOString());
  }
  return c.json({ slots });
});

export default app;