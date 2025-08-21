import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance
 * Returns null if STRIPE_SECRET_KEY is not configured
 */
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY environment variable not configured');
    return null;
  }
  
  if (!stripeInstance) {
    try {
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    } catch (error) {
      console.error('Failed to create Stripe client:', error);
      return null;
    }
  }
  
  return stripeInstance;
}

export default getStripe;