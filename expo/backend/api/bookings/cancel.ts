import { getAdminClient } from '../../lib/supabase';
import type { Booking } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, reason, userId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing required field: bookingId' });
    }

    const supabase = getAdminClient();

    // First, fetch the booking to verify ownership and status
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        barbers!inner(user_id)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking:', fetchError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is authorized to cancel (either the client or the barber)
    const isClient = booking.client_user_id === userId;
    const isBarber = booking.barbers?.user_id === userId;
    
    if (!isClient && !isBarber) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled (must be pending or confirmed)
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel booking with status: ${booking.status}` 
      });
    }

    // Update booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling booking:', updateError);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    // Transform to frontend format
    const transformedBooking: Booking = {
      id: updatedBooking.id,
      barberId: updatedBooking.barber_id,
      serviceId: updatedBooking.service_id,
      startISO: updatedBooking.start_iso,
      endISO: updatedBooking.end_iso,
      clientName: updatedBooking.client_name,
      clientPhone: updatedBooking.client_phone,
      clientUserId: updatedBooking.client_user_id,
      note: updatedBooking.note,
      status: updatedBooking.status,
      paymentIntentId: updatedBooking.payment_intent_id,
      createdAtISO: updatedBooking.created_at,
    };

    return res.status(200).json({ booking: transformedBooking });
  } catch (error) {
    console.error('Error in bookings/cancel:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}