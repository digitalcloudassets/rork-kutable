import { getAdminClient } from '../../lib/supabase';
import type { Booking } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barberId, serviceId, startISO, clientName, clientPhone, clientUserId, note } = req.body;

    if (!barberId || !serviceId || !startISO || !clientName || !clientPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getAdminClient();

    // Get service details to calculate end time
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .eq('barber_id', barberId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Calculate end time
    const startTime = new Date(startISO);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60 * 1000);
    const endISO = endTime.toISOString();

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        barber_id: barberId,
        service_id: serviceId,
        start_iso: startISO,
        end_iso: endISO,
        client_name: clientName,
        client_phone: clientPhone,
        client_user_id: clientUserId || null,
        note: note || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Transform to frontend format
    const transformedBooking: Booking = {
      id: booking.id,
      barberId: booking.barber_id,
      serviceId: booking.service_id,
      startISO: booking.start_iso,
      endISO: booking.end_iso,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      clientUserId: booking.client_user_id,
      note: booking.note,
      status: booking.status,
      createdAtISO: booking.created_at,
    };

    return res.status(200).json({ booking: transformedBooking });
  } catch (error) {
    console.error('Error in bookings/create:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}