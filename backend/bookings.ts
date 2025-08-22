import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

const app = new Hono();

// List bookings
app.post('/api/bookings/list', async c => {
  const { userId, barberId, range } = await c.req.json();
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 503);

  let query = supa
    .from('bookings')
    .select(`
      *,
      barbers!inner(name),
      services!inner(name)
    `);

  // Filter by user or barber
  if (userId) {
    query = query.eq('client_user_id', userId);
  } else if (barberId) {
    query = query.eq('barber_id', barberId);
  }

  // Apply date range filter
  if (range) {
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    query = query.gte('start_utc', startDate.toISOString());
  }

  const { data: bookings, error } = await query.order('start_utc', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }

  // Transform to frontend format
  const transformedBookings = (bookings || []).map((booking: any) => ({
    id: booking.id,
    barberId: booking.barber_id,
    barberName: booking.barbers?.name,
    serviceId: booking.service_id,
    serviceName: booking.services?.name,
    startISO: booking.start_utc,
    endISO: booking.end_utc,
    clientName: booking.client_name,
    clientPhone: booking.client_phone,
    clientUserId: booking.client_user_id,
    note: booking.note,
    status: booking.status,
    paymentIntentId: booking.payment_intent_id,
    createdAtISO: booking.created_at,
  }));

  return c.json({ bookings: transformedBookings });
});

// Create booking
app.post('/api/bookings/create', async c => {
  const { barberId, serviceId, startISO, clientName, clientPhone, note } = await c.req.json();
  if (!barberId || !serviceId || !startISO || !clientName) return c.json({ error: 'missing fields' }, 400);
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 503);

  // get service
  const { data: svc } = await supa.from('services').select('duration_minutes,price_cents').eq('id', serviceId).single();
  if (!svc) return c.json({ error: 'service not found' }, 404);

  const start = new Date(startISO);
  const end = new Date(start.getTime() + svc.duration_minutes * 60 * 1000);

  // collision check vs blocks & bookings
  const { count: blk } = await supa.from('availability_blocks').select('*', { count:'exact', head:true })
    .eq('barber_id', barberId).lt('start_utc', end.toISOString()).gt('end_utc', start.toISOString());
  if ((blk ?? 0) > 0) return c.json({ error:'Conflicts with blocked time' }, 409);

  const { count: bks } = await supa.from('bookings').select('*', { count:'exact', head:true })
    .eq('barber_id', barberId).not('status','in','("cancelled","refunded")')
    .lt('start_utc', end.toISOString()).gt('end_utc', start.toISOString());
  if ((bks ?? 0) > 0) return c.json({ error:'Conflicts with another booking' }, 409);

  const { data, error } = await supa.from('bookings').insert({
    barber_id: barberId,
    service_id: serviceId,
    service_name: undefined,
    start_utc: start.toISOString(),
    end_utc: end.toISOString(),
    client_name: clientName,
    client_phone: clientPhone ?? null,
    note: note ?? null,
    price_cents: svc.price_cents,
    status: 'pending',
  }).select('*').single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ booking: data });
});

// Cancel booking
app.post('/api/bookings/cancel', async c => {
  const { bookingId } = await c.req.json();
  if (!bookingId) return c.json({ error: 'bookingId required' }, 400);
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 503);
  
  const { error } = await supa.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// Reschedule booking
app.post('/api/bookings/reschedule', async c => {
  const { bookingId, newStartISO } = await c.req.json();
  if (!bookingId || !newStartISO) return c.json({ error: 'bookingId & newStartISO required' }, 400);
  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 503);

  const { data: b } = await supa.from('bookings').select('barber_id,service_id').eq('id', bookingId).single();
  if (!b) return c.json({ error: 'not found' }, 404);
  
  const { data: svc } = await supa.from('services').select('duration_minutes').eq('id', b.service_id).single();
  if (!svc) return c.json({ error: 'service missing' }, 400);

  const start = new Date(newStartISO);
  const end = new Date(start.getTime() + svc.duration_minutes * 60 * 1000);

  // Check for conflicts with availability blocks
  const { count: blk } = await supa.from('availability_blocks').select('*', { count:'exact', head:true })
    .eq('barber_id', b.barber_id).lt('start_utc', end.toISOString()).gt('end_utc', start.toISOString());
  if ((blk ?? 0) > 0) return c.json({ error:'Conflicts with blocked time' }, 409);

  // Check for conflicts with other bookings (excluding current booking)
  const { count: bks } = await supa.from('bookings').select('*', { count:'exact', head:true })
    .eq('barber_id', b.barber_id).not('status','in','("cancelled","refunded")')
    .neq('id', bookingId).lt('start_utc', end.toISOString()).gt('end_utc', start.toISOString());
  if ((bks ?? 0) > 0) return c.json({ error:'Conflicts with another booking' }, 409);

  const { error } = await supa.from('bookings')
    .update({ 
      start_utc: start.toISOString(), 
      end_utc: end.toISOString(), 
      status: 'confirmed' 
    })
    .eq('id', bookingId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

export default app;