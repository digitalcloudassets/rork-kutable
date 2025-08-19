import { getAdminClient } from '../../lib/supabase';
import type { BarberRow } from '../../types';

interface ResponseBody {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
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
      return new Response(JSON.stringify({ 
        chargesEnabled: false, 
        payoutsEnabled: false 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll mock the account status since we don't have actual Stripe integration
    // In production, this would be:
    // const account = await stripe.accounts.retrieve(barberRow.connected_account_id);
    // const chargesEnabled = account.charges_enabled;
    // const payoutsEnabled = account.payouts_enabled;
    
    // Mock: assume account is enabled if it has been created (for demo purposes)
    const mockChargesEnabled = true;
    const mockPayoutsEnabled = true;
    
    console.log(`Checking account status for barber ${barberId}:`, {
      accountId: barberRow.connected_account_id,
      chargesEnabled: mockChargesEnabled,
      payoutsEnabled: mockPayoutsEnabled,
    });

    const response: ResponseBody = {
      chargesEnabled: mockChargesEnabled,
      payoutsEnabled: mockPayoutsEnabled,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in account-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}