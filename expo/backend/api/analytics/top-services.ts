import { getAdminClient } from '../../lib/supabase';
import type { TopService } from '../../types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const range = url.searchParams.get('range') as 'month';

  if (!barberId) {
    return new Response(JSON.stringify({ error: 'barberId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!range || range !== 'month') {
    return new Response(JSON.stringify({ error: 'range must be month' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get completed bookings for the month with service details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        service_id,
        status,
        created_at,
        services!inner(
          id,
          name,
          price_cents
        )
      `)
      .eq('barber_id', barberId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aggregate by service
    const serviceStats = new Map<string, { serviceName: string; bookingsCount: number; grossCents: number }>();
    
    bookings?.forEach((booking: any) => {
      const serviceId = booking.service_id;
      const serviceName = booking.services?.name || 'Unknown Service';
      const priceCents = booking.services?.price_cents || 0;
      
      const existing = serviceStats.get(serviceId);
      if (existing) {
        existing.bookingsCount += 1;
        existing.grossCents += priceCents;
      } else {
        serviceStats.set(serviceId, {
          serviceName,
          bookingsCount: 1,
          grossCents: priceCents,
        });
      }
    });

    // Convert to array and sort by gross revenue
    const topServices: TopService[] = Array.from(serviceStats.entries())
      .map(([serviceId, stats]) => ({
        serviceId,
        serviceName: stats.serviceName,
        bookingsCount: stats.bookingsCount,
        grossCents: stats.grossCents,
      }))
      .sort((a, b) => b.grossCents - a.grossCents)
      .slice(0, 10); // Top 10 services

    return new Response(JSON.stringify({ topServices }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics top services error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}