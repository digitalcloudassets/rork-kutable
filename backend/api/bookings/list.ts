import { getAdminClient } from '../../lib/supabase';
import type { Booking } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, barberId, range } = req.body;

    const supabase = getAdminClient();

    let query = supabase
      .from('bookings')
      .select(`
        *,
        barbers!inner(name),
        services!inner(name)
      `);

    // Filter by user or barber
    if (userId) {
      // For client bookings - would need user_id field in bookings table
      // For now, we'll use client_phone as identifier
      query = query.eq('client_phone', userId);
    } else if (barberId) {
      query = query.eq('barber_id', barberId);
    }

    // Apply date range filter
    if (range) {
      const now = new Date();
      let startDate: Date;
      
      switch (range) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      query = query.gte('start_iso', startDate.toISOString());
    }

    const { data: bookings, error } = await query.order('start_iso', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    // Transform to frontend format
    const transformedBookings: Booking[] = (bookings || []).map((booking: any) => ({
      id: booking.id,
      barberId: booking.barber_id,
      barberName: booking.barbers?.name,
      serviceId: booking.service_id,
      serviceName: booking.services?.name,
      startISO: booking.start_iso,
      endISO: booking.end_iso,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
      note: booking.note,
      status: booking.status,
      paymentIntentId: booking.payment_intent_id,
      createdAtISO: booking.created_at,
    }));

    return res.status(200).json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error in bookings/list:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}