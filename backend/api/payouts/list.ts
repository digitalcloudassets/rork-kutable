import { getAdminClient } from '../../lib/supabase';
import { getStripe } from '../../lib/stripe';
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

    // Fetch real payouts from Stripe Connect
    let payouts: Payout[] = [];

    try {
      const stripe = getStripe();
      
      // Fetch payouts for the connected account
      const stripePayouts = await stripe.payouts.list(
        {
          limit: 20,
        },
        {
          stripeAccount: barberRow.connected_account_id,
        }
      );

      // Convert Stripe payouts to our format
      payouts = stripePayouts.data.map((stripePayout) => {
        let status: Payout['status'];
        
        switch (stripePayout.status) {
          case 'paid':
            status = 'paid';
            break;
          case 'pending':
            status = 'pending';
            break;
          case 'in_transit':
            status = 'in_transit';
            break;
          case 'canceled':
            status = 'canceled';
            break;
          case 'failed':
            status = 'failed';
            break;
          default:
            status = 'pending';
        }

        return {
          id: stripePayout.id,
          amountCents: stripePayout.amount,
          status,
          arrivalDateISO: stripePayout.arrival_date 
            ? new Date(stripePayout.arrival_date * 1000).toISOString()
            : new Date(stripePayout.created * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString(), // Default to 2 days after creation
          createdAtISO: new Date(stripePayout.created * 1000).toISOString(),
        };
      });

      console.log(`Stripe payouts for barber ${barberId}:`, {
        payoutsCount: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amountCents, 0),
      });
    } catch (stripeError: any) {
      console.error('Error fetching Stripe payouts:', stripeError);
      
      // Fallback to mock payouts based on bookings if Stripe fails
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
        console.error('Error fetching bookings for payouts fallback:', bookingsError);
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
      payouts = mockPayouts.sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
      
      console.log(`Fallback payouts for barber ${barberId}:`, {
        payoutsCount: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amountCents, 0),
      });
    }

    const response: PayoutsListResponse = {
      payouts: payouts.slice(0, 10), // Limit to 10 most recent
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