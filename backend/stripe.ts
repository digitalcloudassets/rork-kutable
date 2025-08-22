import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';
import { getStripe } from './lib/stripe';

const app = new Hono();

// Read deep-link scheme/host from env (set these in Rork)
const APP_SCHEME = process.env.APP_SCHEME || 'kutable';
const APP_HOST   = process.env.APP_HOST   || 'kutable.rork.app'; // optional, for universal links
const APP_BASE   = process.env.APP_BASE_URL || `https://${APP_HOST}`;

// Helper: prefer deep link (scheme://path) for mobile return/refresh
function deepLink(path: string) {
  // e.g., kutable://onboarding/stripe/return
  return `${APP_SCHEME}://${path.replace(/^\//,'')}`;
}
// Fallback web URL if needed
function webUrl(path: string) {
  return `${APP_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}



app.post('/api/stripe/create-or-fetch-account', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  const { data: b, error } = await supa.from('barbers')
    .select('id,email,name,connected_account_id').eq('id', barberId).single();
  if (error || !b) return c.json({ error: 'barber not found' }, 404);

  if (b.connected_account_id?.startsWith('acct_')) {
    return c.json({ accountId: b.connected_account_id });
  }

  const stripe = getStripe(); 
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);
  
  const acct = await stripe.accounts.create({
    type: 'express',
    email: b.email ?? undefined,
    capabilities: { 
      card_payments: { requested: true }, 
      transfers: { requested: true } 
    },
    metadata: { barberId },
  });
  
  await supa.from('barbers')
    .update({ 
      connected_account_id: acct.id, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', barberId);
    
  return c.json({ accountId: acct.id });
});

app.post('/api/stripe/account-link', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  const { data, error } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId)
    .single();
  if (error || !data?.connected_account_id) return c.json({ error: 'no connected account' }, 400);

  const stripe = getStripe();
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);

  // Build both deep link and web fallbacks
  const refresh_url = deepLink('/onboarding/stripe/refresh');
  const return_url  = deepLink('/onboarding/stripe/return');
  // Some Android devices ignore custom schemes; include web fallbacks in metadata
  const fallback_refresh = webUrl('/onboarding/stripe?status=refresh');
  const fallback_return  = webUrl('/onboarding/stripe?status=return');

  const link = await stripe.accountLinks.create({
    account: data.connected_account_id,
    type: 'account_onboarding',
    refresh_url,
    return_url,
  });

  return c.json({
    url: link.url,
    fallback: { refresh: fallback_refresh, return: fallback_return }
  });
});

app.get('/api/stripe/account-status', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const barberId = c.req.query('barberId');
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  const { data } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId)
    .single();

  const acc = data?.connected_account_id;
  if (!acc?.startsWith('acct_')) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  const stripe = getStripe();
  if (!stripe) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  try {
    const a = await stripe.accounts.retrieve(acc);
    return c.json({
      chargesEnabled: !!a.charges_enabled,
      payoutsEnabled: !!a.payouts_enabled,
    });
  } catch {
    return c.json({ chargesEnabled:false, payoutsEnabled:false });
  }
});

app.get('/api/stripe/onboarding/return', c => {
  return c.text('Onboarding complete. You can close this window and return to the app.');
});

app.get('/api/stripe/onboarding/refresh', c => {
  return c.text('Please retry onboarding from the app.');
});

// Minimal webhook stub: set STRIPE_WEBHOOK_SECRET in server env
app.post('/api/payments/webhook', async c => {
  return c.json({ received: true }, 200);
});

export default app;