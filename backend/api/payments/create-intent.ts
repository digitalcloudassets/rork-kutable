import { getStripe } from '../../lib/stripe';
import { getAdminClient } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId' });
    }

    const supabase = getAdminClient();

    // Get booking details with barber and service info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        barbers!inner(connected_account_id),
        services!inner(price_cents, name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const barber = booking.barbers;
    const service = booking.services;

    if (!barber.connected_account_id) {
      return res.status(400).json({ error: 'Barber account not connected' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Calculate amounts (platform takes 2.9% + $0.30)
    const totalAmount = service.price_cents;
    const platformFee = Math.round(totalAmount * 0.029) + 30; // 2.9% + $0.30 in cents
    const applicationFeeAmount = platformFee;

    // Create payment intent with direct charges to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: barber.connected_account_id,
      },
      metadata: {
        bookingId: bookingId,
        barberId: booking.barber_id,
        serviceId: booking.service_id,
        serviceName: service.name,
        clientName: booking.client_name,
      },
      description: `${service.name} with ${booking.client_name}`,
    });

    // Update booking with payment intent ID
    await supabase
      .from('bookings')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', bookingId);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}