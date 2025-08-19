import { getAdminClient } from '../../lib/supabase';
import type { BarberRow } from '../../types';

interface RequestBody {
  barberId: string;
}



export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { barberId }: RequestBody = await req.json();

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

    // If barber already has a connected account, return it
    if (barberRow.connected_account_id) {
      return new Response(JSON.stringify({ accountId: barberRow.connected_account_id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll create a mock account ID since we don't have actual Stripe integration
    // In production, this would be: const account = await stripe.accounts.create({ type: 'express' });
    const mockAccountId = `acct_mock_${barberId}_${Date.now()}`;
    
    console.log(`Creating Stripe account for barber ${barberId}:`, mockAccountId);

    // Update barber with the new connected account ID
    const { error: updateError } = await supabase
      .from('barbers')
      .update({ connected_account_id: mockAccountId })
      .eq('id', barberId);

    if (updateError) {
      console.error('Error updating barber with account ID:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update barber account' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ accountId: mockAccountId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-or-fetch-account:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}