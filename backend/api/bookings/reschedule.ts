import { getAdminClient } from '../../lib/supabase';
import type { Booking } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, newStartISO, userId } = req.body;

    if (!bookingId || !newStartISO) {
      return res.status(400).json({ error: 'Missing required fields: bookingId, newStartISO' });
    }

    const supabase = getAdminClient();

    // First, get the booking with service details to validate ownership and calculate new end time
    const { data: bookingWithService, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        services!inner(duration_minutes)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !bookingWithService) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingWithService;
    const serviceDuration = booking.services.duration_minutes;

    // Check if user has permission to reschedule (barber owner or client)
    const canReschedule = booking.barber_id === userId || booking.client_user_id === userId;
    if (!canReschedule) {
      return res.status(403).json({ error: 'Not authorized to reschedule this booking' });
    }

    // Check if booking can be rescheduled (must be pending or confirmed)
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule booking with status: ${booking.status}` 
      });
    }

    // Calculate new end time
    const newStartTime = new Date(newStartISO);
    const newEndTime = new Date(newStartTime.getTime() + serviceDuration * 60 * 1000);
    const newEndISO = newEndTime.toISOString();

    // Validate new start time is in the future
    const now = new Date();
    if (newStartTime <= now) {
      return res.status(400).json({ error: 'New booking time must be in the future' });
    }

    // Check for collision with other bookings (excluding current booking)
    const { data: conflictingBookings, error: bookingConflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('barber_id', booking.barber_id)
      .neq('id', bookingId) // Exclude current booking
      .in('status', ['pending', 'confirmed'])
      .or(`and(start_iso.lt.${newEndISO},end_iso.gt.${newStartISO})`);

    if (bookingConflictError) {
      console.error('Error checking booking conflicts:', bookingConflictError);
      return res.status(500).json({ error: 'Failed to validate new booking time' });
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      return res.status(400).json({ 
        error: 'New time slot conflicts with existing booking' 
      });
    }

    // Check for collision with availability blocks
    const { data: conflictingBlocks, error: blockConflictError } = await supabase
      .from('availability_blocks')
      .select('id')
      .eq('barber_id', booking.barber_id)
      .or(`and(start_utc.lt.${newEndISO},end_utc.gt.${newStartISO})`);

    if (blockConflictError) {
      console.error('Error checking availability block conflicts:', blockConflictError);
      return res.status(500).json({ error: 'Failed to validate new booking time' });
    }

    if (conflictingBlocks && conflictingBlocks.length > 0) {
      return res.status(400).json({ 
        error: 'New time slot conflicts with blocked availability' 
      });
    }

    // Update booking with new time and set status to confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        start_iso: newStartISO,
        end_iso: newEndISO,
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling booking:', updateError);
      return res.status(500).json({ error: 'Failed to reschedule booking' });
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
    console.error('Error in bookings/reschedule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}