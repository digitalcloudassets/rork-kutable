import { getAdminClient } from '../../lib/supabase';
import { getStripe } from '../../lib/stripe';
import type { BarberRow } from '../../types';

interface EarningsSummaryResponse {
  grossCents: number;
  feesCents: number;
  netCents: number;
  range: string;
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
        netCents: 0,
        range,
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

    // Fetch real earnings data from Stripe Connect
    let grossCents = 0;
    let feesCents = 0;
    let netCents = 0;

    try {
      const stripe = getStripe();
      
      // Fetch balance transactions for the connected account
      const balanceTransactions = await stripe.balanceTransactions.list(
        {
          created: {
            gte: Math.floor(startDate.getTime() / 1000),
            lt: Math.floor(now.getTime() / 1000),
          },
          type: 'charge',
          limit: 100,
        },
        {
          stripeAccount: barberRow.connected_account_id,
        }
      );

      // Calculate totals from Stripe balance transactions
      for (const transaction of balanceTransactions.data) {
        // Gross amount (before fees)
        grossCents += transaction.amount;
        
        // Stripe fees
        feesCents += transaction.fee;
        
        // Net amount (after fees)
        netCents += transaction.net;
      }

      console.log(`Stripe earnings for barber ${barberId} (${range}):`, {
        transactionCount: balanceTransactions.data.length,
        grossCents,
        feesCents,
        netCents,
      });
    } catch (stripeError: any) {
      console.error('Error fetching Stripe balance transactions:', stripeError);
      
      // Fallback to bookings-based calculation if Stripe fails
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', now.toISOString());

      if (bookingsError) {
        console.error('Error fetching bookings fallback:', bookingsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch earnings data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Calculate earnings from completed bookings (fallback)
      grossCents = (bookings || []).reduce((total, booking) => {
        return total + (booking.total_price_cents || 0);
      }, 0);

      // Calculate platform fees (2.9% + $0.30 per transaction)
      feesCents = (bookings || []).reduce((total, booking) => {
        const bookingAmount = booking.total_price_cents || 0;
        const percentageFee = Math.round(bookingAmount * 0.029);
        const fixedFee = 30; // $0.30 in cents
        return total + percentageFee + fixedFee;
      }, 0);

      netCents = grossCents - feesCents;
      
      console.log(`Fallback earnings calculation for barber ${barberId} (${range}):`, {
        bookingsCount: bookings?.length || 0,
        grossCents,
        feesCents,
        netCents,
      });
    }



    const response: EarningsSummaryResponse = {
      grossCents,
      feesCents,
      netCents,
      range,
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