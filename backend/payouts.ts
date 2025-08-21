import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';

const app = new Hono();

app.get('/api/payouts/list', async (c) => {
  const supabase = getAdminClient();
  if (!supabase) {
    return c.json({ error: 'Database not configured' }, 503);
  }
  
  try {
    return c.json({ error: 'Not implemented yet' }, 501);
  } catch (error: any) {
    console.error('Payouts error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;