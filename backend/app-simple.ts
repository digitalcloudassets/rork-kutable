import { Hono } from 'hono';
import { cors } from 'hono/cors';
import health from './health';
import stripe from './stripe';
import availability from './availability';
import services from './services';
import bookings from './bookings';
import earnings from './earnings';
import payouts from './payouts';

const app = new Hono();

// CORS for mobile app (Expo)
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
}));

// Mount modules (add as they exist; harmless if file missing)
app.route('/', health);
app.route('/', stripe);
app.route('/', availability);
app.route('/', services);
app.route('/', bookings);
app.route('/', earnings);
app.route('/', payouts);

export default app;