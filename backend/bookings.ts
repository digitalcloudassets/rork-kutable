import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

const app = new Hono();

app.post('/api/bookings/create', async (c) => {
  const supabase = getAdminClient();
  if (!supabase) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  
  try {
    return c.json({ error: 'Not implemented yet' }, 501);
  } catch (error: any) {
    console.error('Bookings error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/bookings/list', async (c) => {
  const supabase = getAdminClient();
  if (!supabase) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  
  try {
    return c.json({ error: 'Not implemented yet' }, 501);
  } catch (error: any) {
    console.error('Bookings error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;