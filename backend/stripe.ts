import { Hono } from 'hono';
import { getAdminClient } from './lib/supabase';
import { getStripe } from './lib/stripe';

const app = new Hono();
const base = (req: Request) => process.env.APP_BASE_URL || new URL(req.url).origin;

app.post('/api/stripe/create-or-fetch-account', async c => {
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
  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  const { data } = await supa.from('barbers')
    .select('connected_account_id').eq('id', barberId).single();
  const accountId = data?.connected_account_id;
  if (!accountId?.startsWith('acct_')) {
    return c.json({ error: 'no connected account' }, 400);
  }

  const stripe = getStripe(); 
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);
  
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${base(c.req.raw)}/api/stripe/onboarding/refresh?barberId=${barberId}`,
    return_url:  `${base(c.req.raw)}/api/stripe/onboarding/return?barberId=${barberId}`,
  });
  
  return c.json({ url: link.url });
});

app.get('/api/stripe/account-status', async c => {
  const barberId = c.req.query('barberId');
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  const { data } = await supa.from('barbers')
    .select('connected_account_id').eq('id', barberId).single();
  const accountId = data?.connected_account_id;
  
  if (!accountId?.startsWith('acct_')) {
    return c.json({ 
      accountId: null, 
      chargesEnabled: false, 
      payoutsEnabled: false, 
      requirementsDue: true 
    });
  }

  const stripe = getStripe(); 
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);
  
  const acct = await stripe.accounts.retrieve(accountId);
  return c.json({
    accountId,
    chargesEnabled: acct.charges_enabled,
    payoutsEnabled: acct.payouts_enabled,
    requirementsDue: (acct.requirements?.currently_due?.length ?? 0) > 0,
  });
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