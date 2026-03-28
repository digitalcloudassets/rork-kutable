import Stripe from 'stripe';
import { resolveEnv, Bindings } from './env';

let stripeInstance: Stripe | null = null;
let lastStripeSecret: string | null = null;

/**
 * Get Stripe client instance
 * Returns null if STRIPE_SECRET_KEY is not configured
 */
export function getStripe(bindings?: Bindings): Stripe | null {
  const { stripeSecret } = resolveEnv(bindings);
  
  if (!stripeSecret) {
    console.warn('STRIPE_SECRET_KEY environment variable not configured');
    return null;
  }
  
  // Recreate instance if secret changed (for Edge runtime compatibility)
  if (!stripeInstance || lastStripeSecret !== stripeSecret) {
    try {
      stripeInstance = new Stripe(stripeSecret);
      lastStripeSecret = stripeSecret;
    } catch (error) {
      console.error('Failed to create Stripe client:', error);
      return null;
    }
  }
  
  return stripeInstance;
}

export default getStripe;