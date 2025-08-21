import { Hono } from 'hono';
import { getStripe } from './lib/stripe';

const app = new Hono();

// Basic Stripe endpoints that return proper errors when not configured
app.post('/api/stripe/create-or-fetch-account', async (c) => {
  const stripe = getStripe();
  if (!stripe) {
    return c.json({ error: 'Stripe not configured' }, 503);
  }
  
  try {
    // Basic implementation - would need actual logic
    return c.json({ error: 'Not implemented yet' }, 501);
  } catch (error: any) {
    console.error('Stripe error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/stripe/account-status', async (c) => {
  const stripe = getStripe();
  if (!stripe) {
    return c.json({ error: 'Stripe not configured' }, 503);
  }
  
  try {
    return c.json({ error: 'Not implemented yet' }, 501);
  } catch (error: any) {
    console.error('Stripe error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;