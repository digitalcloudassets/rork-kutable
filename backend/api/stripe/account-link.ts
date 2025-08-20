import { getAdminClient } from '../../lib/supabase';
import { getStripe } from '../../lib/stripe';
import type { BarberRow } from '../../types';

interface RequestBody {
  barberId: string;
  refreshUrl?: string;
  returnUrl?: string;
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

    if (!barberId) {
      return new Response(JSON.stringify({ error: 'barberId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get base URL from environment or request
    function getBaseUrl(req: Request) {
      const b = process.env.APP_BASE_URL;
      if (b) return b.replace(/\/$/, '');
      const u = new URL(req.url);
      return `${u.protocol}//${u.host}`;
    }
    
    const baseUrl = getBaseUrl(req);
    const finalRefreshUrl = refreshUrl || `${baseUrl}/api/stripe/onboarding/refresh?barberId=${barberId}`;
    const finalReturnUrl = returnUrl || `${baseUrl}/api/stripe/onboarding/return?barberId=${barberId}`;

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

    // Create Stripe account link for onboarding
    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: barberRow.connected_account_id,
      refresh_url: finalRefreshUrl,
      return_url: finalReturnUrl,
      type: 'account_onboarding',
    });
    
    console.log(`Created account link for barber ${barberId}:`, accountLink.url);

    const response: ResponseBody = { url: accountLink.url };

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