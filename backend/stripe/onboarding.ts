import { Hono } from 'hono';
import { getAdminClient } from '../lib/supabase';
import { getStripe } from '../lib/stripe';

const app = new Hono();

function baseUrl(req: Request) {
  const b = process.env.APP_BASE_URL;
  if (b) return b.replace(/\/$/, '');
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

// POST /api/stripe/create-or-fetch-account { barberId }
app.post('/api/stripe/create-or-fetch-account', async (c) => {
  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  const { data: barber, error } = await supa
    .from('barbers')
    .select('id, email, name, connected_account_id')
    .eq('id', barberId)
    .single();
  if (error || !barber) return c.json({ error: 'barber not found' }, 404);

  if (barber.connected_account_id?.startsWith('acct_')) {
    return c.json({ accountId: barber.connected_account_id });
  }

  const stripe = getStripe();
  const acct = await stripe.accounts.create({
    type: 'express',
    email: barber.email ?? undefined,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { barberId },
  });

  await supa
    .from('barbers')
    .update({ connected_account_id: acct.id, updated_at: new Date().toISOString() })
    .eq('id', barberId);

  return c.json({ accountId: acct.id });
});

// POST /api/stripe/account-link { barberId }
app.post('/api/stripe/account-link', async (c) => {
  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  const { data } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId)
    .single();
  const accountId = data?.connected_account_id;
  if (!accountId?.startsWith('acct_')) return c.json({ error: 'no connected account' }, 400);

  const base = baseUrl(c.req.raw);
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${base}/api/stripe/onboarding/refresh?barberId=${barberId}`,
    return_url: `${base}/api/stripe/onboarding/return?barberId=${barberId}`,
  });

  return c.json({ url: link.url });
});

// GET /api/stripe/account-status?barberId=...
app.get('/api/stripe/account-status', async (c) => {
  const barberId = c.req.query('barberId');
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient();
  const { data } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId)
    .single();
  const accountId = data?.connected_account_id;
  if (!accountId?.startsWith('acct_')) return c.json({ chargesEnabled: false, payoutsEnabled: false });

  const stripe = getStripe();
  const acct = await stripe.accounts.retrieve(accountId);
  return c.json({ chargesEnabled: acct.charges_enabled, payoutsEnabled: acct.payouts_enabled });
});

// Optional landing endpoints so Stripe can redirect somewhere clean
app.get('/api/stripe/onboarding/return', (c) => c.text('Onboarding complete. You can close this window.'));
app.get('/api/stripe/onboarding/refresh', (c) => c.text('Please retry onboarding from the app.'));

export default app;