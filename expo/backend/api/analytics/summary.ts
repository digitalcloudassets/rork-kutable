import { getAdminClient } from '../../lib/supabase';
import type { AnalyticsSummary } from '../../types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const range = url.searchParams.get('range') as 'week' | 'month';

  if (!barberId) {
    return new Response(JSON.stringify({ error: 'barberId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!range || !['week', 'month'].includes(range)) {
    return new Response(JSON.stringify({ error: 'range must be week or month' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date();
    let startDate: Date;

    if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get bookings for the period
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        services!inner(price_cents)
      `)
      .eq('barber_id', barberId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate metrics
    const completedBookings = bookings?.filter((b: any) => b.status === 'completed') || [];
    const cancelledBookings = bookings?.filter((b: any) => b.status === 'cancelled') || [];
    
    const bookingsCount = completedBookings.length;
    const cancellationsCount = cancelledBookings.length;
    
    const grossCents = completedBookings.reduce((sum: number, booking: any) => {
      return sum + (booking.services?.price_cents || 0);
    }, 0);
    
    // Assume 3% + $0.30 Stripe fee for net calculation
    const stripeFees = Math.round(grossCents * 0.03 + (completedBookings.length * 30));
    const netCents = grossCents - stripeFees;
    
    const avgTicketCents = bookingsCount > 0 ? Math.round(grossCents / bookingsCount) : 0;

    const summary: AnalyticsSummary = {
      bookingsCount,
      grossCents,
      netCents,
      avgTicketCents,
      cancellationsCount,
      range,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}