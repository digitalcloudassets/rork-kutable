import { getAdminClient } from '../../lib/supabase';
import type { BarberRow } from '../../types';

interface RequestBody {
  barberId: string;
  refreshUrl: string;
  returnUrl: string;
}

interface ResponseBody {
  url: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { barberId, refreshUrl, returnUrl }: RequestBody = await req.json();

    if (!barberId || !refreshUrl || !returnUrl) {
      return new Response(JSON.stringify({ error: 'barberId, refreshUrl, and returnUrl are required' }), {
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
      return new Response(JSON.stringify({ error: 'Barber does not have a connected account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll create a mock onboarding URL since we don't have actual Stripe integration
    // In production, this would be:
    // const accountLink = await stripe.accountLinks.create({
    //   account: barberRow.connected_account_id,
    //   refresh_url: refreshUrl,
    //   return_url: returnUrl,
    //   type: 'account_onboarding',
    // });
    
    const mockOnboardingUrl = `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl)}`;
    
    console.log(`Creating account link for barber ${barberId}:`, mockOnboardingUrl);

    const response: ResponseBody = { url: mockOnboardingUrl };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in account-link:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}