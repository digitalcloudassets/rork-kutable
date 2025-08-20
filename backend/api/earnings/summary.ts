import { getAdminClient } from '../../lib/supabase';
import type { BarberRow } from '../../types';

interface EarningsSummaryRequest {
  barberId: string;
  range: 'today' | 'week' | 'month';
}

interface EarningsSummaryResponse {
  grossCents: number;
  feesCents: number;
  netCents: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const barberId = url.searchParams.get('barberId');
    const range = url.searchParams.get('range') as 'today' | 'week' | 'month';

    if (!barberId) {
      return new Response(JSON.stringify({ error: 'barberId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!range || !['today', 'week', 'month'].includes(range)) {
      return new Response(JSON.stringify({ error: 'range must be today, week, or month' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAdminClient();
    
    // Get barber from database
    const { data: barber, error: fetchError } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single();

    if (fetchError || !barber) {
      return new Response(JSON.stringify({ error: 'Barber not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const barberRow = barber as BarberRow;

    if (!barberRow.connected_account_id) {
      return new Response(JSON.stringify({ 
        grossCents: 0,
        feesCents: 0,
        netCents: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // In production, this would fetch from Stripe:
    // const charges = await stripe.charges.list({
    //   created: {
    //     gte: Math.floor(startDate.getTime() / 1000),
    //     lt: Math.floor(now.getTime() / 1000),
    //   },
    //   destination: barberRow.connected_account_id,
    // });
    
    // For now, we'll fetch from our bookings table and calculate mock earnings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('barber_id', barberId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', now.toISOString());

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch earnings data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate earnings from completed bookings
    const grossCents = (bookings || []).reduce((total, booking) => {
      return total + (booking.total_price_cents || 0);
    }, 0);

    // Calculate platform fees (2.9% + $0.30 per transaction)
    const feesCents = (bookings || []).reduce((total, booking) => {
      const bookingAmount = booking.total_price_cents || 0;
      const percentageFee = Math.round(bookingAmount * 0.029);
      const fixedFee = 30; // $0.30 in cents
      return total + percentageFee + fixedFee;
    }, 0);

    const netCents = grossCents - feesCents;

    console.log(`Earnings summary for barber ${barberId} (${range}):`, {
      grossCents,
      feesCents,
      netCents,
      bookingsCount: bookings?.length || 0,
    });

    const response: EarningsSummaryResponse = {
      grossCents,
      feesCents,
      netCents,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in earnings summary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}