import { getStripe } from '../../lib/stripe';
import { getAdminClient } from '../../lib/supabase';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const stripe = getStripe();
    if (!stripe) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or webhook secret' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAdminClient();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
          // Update booking status to confirmed
          await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              payment_intent_id: paymentIntent.id 
            })
            .eq('id', bookingId);

          console.log(`Payment succeeded for booking ${bookingId}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBookingId = failedPayment.metadata?.bookingId;

        if (failedBookingId) {
          // Update booking status to cancelled
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', failedBookingId);

          console.log(`Payment failed for booking ${failedBookingId}`);
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        const barberId = account.metadata?.barberId;
        
        if (barberId) {
          const chargesEnabled = account.charges_enabled || false;
          const payoutsEnabled = account.payouts_enabled || false;
          const stripeStatus = chargesEnabled && payoutsEnabled ? 'enabled' : 'pending';
          
          // Update barber's Stripe status in database
          await supabase
            .from('barbers')
            .update({ stripe_status: stripeStatus })
            .eq('id', barberId);
            
          console.log(`Account updated for barber ${barberId}: ${stripeStatus}`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}