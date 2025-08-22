import { Hono } from 'hono';
import Stripe from 'stripe';
import { getAdminClient } from './lib/supabase';
import { resolveEnv, Bindings } from './lib/env';

const stripeApp = new Hono<{ Bindings: Bindings }>();

function getStripe(c: any) {
  const { stripeSecret } = resolveEnv(c.env);
  if (!stripeSecret) return null;
  return new Stripe(stripeSecret);
}



// POST /api/stripe/create-or-fetch-account
stripeApp.post('/api/stripe/create-or-fetch-account', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient(c.env);
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  // fetch barber
  const { data: b, error } = await supa
    .from('barbers')
    .select('id,email,connected_account_id')
    .eq('id', barberId).single();
  if (error || !b) return c.json({ error: 'barber not found' }, 404);

  let accountId = b.connected_account_id as string | null;
  const stripe = getStripe(c);
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);

  if (!accountId) {
    const acct = await stripe.accounts.create({
      type: 'express',
      email: b.email ?? undefined,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { barberId },
    });
    accountId = acct.id;
    await supa.from('barbers').update({ connected_account_id: accountId }).eq('id', barberId);
  }

  return c.json({ accountId });
});

// POST /api/stripe/account-link
stripeApp.post('/api/stripe/account-link', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const { barberId } = await c.req.json();
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient(c.env);
  if (!supa) return c.json({ error: 'Database not configured' }, 500);

  const { data } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId).single();
  const accountId = data?.connected_account_id;
  if (!accountId) return c.json({ error: 'no connected account' }, 400);

  const { appBaseUrl, appScheme } = resolveEnv(c.env);
  const stripe = getStripe(c);
  if (!stripe) return c.json({ error: 'Stripe not configured' }, 500);

  const deep = (p: string) => `${appScheme}://${p.replace(/^\//,'')}`;
  const web  = (p: string) => `${appBaseUrl}${p.startsWith('/') ? p : `/${p}`}`;

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: deep('/onboarding/stripe/refresh'),
    return_url:  deep('/onboarding/stripe/return'),
  });

  return c.json({
    url: link.url,
    fallback: {
      refresh: web('/onboarding/stripe?status=refresh'),
      return:  web('/onboarding/stripe?status=return'),
    }
  });
});

// GET /api/stripe/account-status
stripeApp.get('/api/stripe/account-status', async c => {
  c.header('Content-Type', 'application/json; charset=utf-8');
  c.header('Cache-Control', 'no-store');

  const barberId = c.req.query('barberId');
  if (!barberId) return c.json({ error: 'barberId required' }, 400);

  const supa = getAdminClient(c.env);
  if (!supa) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  const { data } = await supa
    .from('barbers')
    .select('connected_account_id')
    .eq('id', barberId).single();

  const accountId = data?.connected_account_id;
  if (!accountId) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  const stripe = getStripe(c);
  if (!stripe) return c.json({ chargesEnabled:false, payoutsEnabled:false });

  try {
    const acc = await stripe.accounts.retrieve(accountId);
    return c.json({
      chargesEnabled: !!acc.charges_enabled,
      payoutsEnabled: !!acc.payouts_enabled,
    });
  } catch {
    return c.json({ chargesEnabled:false, payoutsEnabled:false });
  }
});

export default stripeApp;