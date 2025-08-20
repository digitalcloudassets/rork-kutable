import { getAdminClient } from '../../lib/supabase';
import type { TimeSeriesPoint } from '../../types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  const bucket = url.searchParams.get('bucket') || 'day';

  if (!barberId || !start || !end) {
    return new Response(JSON.stringify({ error: 'barberId, start, and end are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (bucket !== 'day') {
    return new Response(JSON.stringify({ error: 'Only day bucket is supported' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getAdminClient();
    const startDate = new Date(start);
    const endDate = new Date(end);

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
      .lte('created_at', endDate.toISOString());

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group bookings by date
    const dailyData = new Map<string, { bookingsCount: number; grossCents: number }>();
    
    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData.set(dateStr, { bookingsCount: 0, grossCents: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate bookings by date
    bookings?.forEach((booking: any) => {
      if (booking.status === 'completed') {
        const dateStr = booking.created_at.split('T')[0];
        const existing = dailyData.get(dateStr);
        if (existing) {
          existing.bookingsCount += 1;
          existing.grossCents += booking.services?.price_cents || 0;
        }
      }
    });

    // Convert to array format
    const timeSeries: TimeSeriesPoint[] = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      bookingsCount: data.bookingsCount,
      grossCents: data.grossCents,
    }));

    return new Response(JSON.stringify({ timeSeries }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics timeseries error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}