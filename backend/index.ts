// Mount the app + Stripe router
import app from './app';
import stripeApp from './stripe';

// Keep Stripe under /api/stripe/*
app.route('/api/stripe', stripeApp);

export default app;