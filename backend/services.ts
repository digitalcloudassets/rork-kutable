import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

const app = new Hono();

app.post('/api/services/list', async c => {
  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const { data, error } = await supa.from('services')
    .select('*')
    .eq('barber_id', barberId)
    .order('name', { ascending: true });
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ services: data ?? [] });
});

app.post('/api/services/create', async c => {
  const { barberId, name, durationMinutes, priceCents, description } = await c.req.json();
  if (!barberId || !name || !durationMinutes || priceCents == null) {
    return c.json({ error: 'missing fields' }, 400);
  }
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const { data, error } = await supa.from('services').insert({
    barber_id: barberId,
    name,
    duration_minutes: durationMinutes,
    price_cents: priceCents,
    description: description ?? null,
    active: true
  }).select('*').single();
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ service: data });
});

app.post('/api/services/update', async c => {
  const { id, barberId, ...rest } = await c.req.json();
  if (!id || !barberId) return c.json({ error: 'id and barberId required' }, 400);
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const updateData: any = {};
  
  if (rest.name) updateData.name = rest.name;
  if (rest.durationMinutes != null) updateData.duration_minutes = rest.durationMinutes;
  if (rest.priceCents != null) updateData.price_cents = rest.priceCents;
  if (rest.description !== undefined) updateData.description = rest.description;
  
  const { error } = await supa.from('services')
    .update(updateData)
    .eq('id', id)
    .eq('barber_id', barberId);
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

app.post('/api/services/toggle', async c => {
  const { id, barberId, active } = await c.req.json();
  if (!id || !barberId || active == null) {
    return c.json({ error: 'id, barberId, active required' }, 400);
  }
  
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);
  
  const { error } = await supa.from('services')
    .update({ active })
    .eq('id', id)
    .eq('barber_id', barberId);
  
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

export default app;