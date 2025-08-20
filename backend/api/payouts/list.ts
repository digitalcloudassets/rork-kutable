import { getAdminClient } from '../../lib/supabase';
import type { BarberRow } from '../../types';

interface Payout {
  id: string;
  amountCents: number;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  arrivalDateISO: string;
  createdAtISO: string;
}

interface PayoutsListResponse {
  payouts: Payout[];
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

    if (!barberId) {
      return new Response(JSON.stringify({ error: 'barberId is required' }), {
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
      return new Response(JSON.stringify({ payouts: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In production, this would fetch from Stripe:
    // const payouts = await stripe.payouts.list({
    //   stripeAccount: barberRow.connected_account_id,
    //   limit: 20,
    // });
    
    // For demo purposes, generate mock payouts based on completed bookings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('barber_id', barberId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings for payouts:', bookingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch payouts data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group bookings by week to simulate weekly payouts
    const weeklyGroups: { [key: string]: any[] } = {};
    
    (bookings || []).forEach(booking => {
      const bookingDate = new Date(booking.created_at);
      const weekStart = new Date(bookingDate);
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      weeklyGroups[weekKey].push(booking);
    });

    // Create mock payouts from weekly groups
    const mockPayouts: Payout[] = Object.entries(weeklyGroups).map(([weekKey, weekBookings], index) => {
      const grossAmount = weekBookings.reduce((total, booking) => {
        return total + (booking.total_price_cents || 0);
      }, 0);
      
      // Calculate fees
      const fees = weekBookings.reduce((total, booking) => {
        const bookingAmount = booking.total_price_cents || 0;
        const percentageFee = Math.round(bookingAmount * 0.029);
        const fixedFee = 30;
        return total + percentageFee + fixedFee;
      }, 0);
      
      const netAmount = grossAmount - fees;
      
      if (netAmount <= 0) return null;
      
      const weekStartDate = new Date(weekKey);
      const payoutDate = new Date(weekStartDate);
      payoutDate.setDate(payoutDate.getDate() + 7); // Payout a week later
      
      const arrivalDate = new Date(payoutDate);
      arrivalDate.setDate(arrivalDate.getDate() + 2); // Arrives 2 days after payout
      
      const now = new Date();
      let status: Payout['status'];
      
      if (arrivalDate < now) {
        status = 'paid';
      } else if (payoutDate < now) {
        status = 'in_transit';
      } else {
        status = 'pending';
      }
      
      return {
        id: `po_mock_${barberId}_${weekKey}_${index}`,
        amountCents: netAmount,
        status,
        arrivalDateISO: arrivalDate.toISOString(),
        createdAtISO: payoutDate.toISOString(),
      };
    }).filter(Boolean) as Payout[];

    // Sort by creation date, newest first
    mockPayouts.sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());

    console.log(`Payouts list for barber ${barberId}:`, {
      payoutsCount: mockPayouts.length,
      totalAmount: mockPayouts.reduce((sum, p) => sum + p.amountCents, 0),
    });

    const response: PayoutsListResponse = {
      payouts: mockPayouts.slice(0, 10), // Limit to 10 most recent
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in payouts list:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}