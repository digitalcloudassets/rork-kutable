import app from './app';
import stripeApp from './stripe';

// Mount Stripe routes
app.route('/api/stripe', stripeApp);

export default app;