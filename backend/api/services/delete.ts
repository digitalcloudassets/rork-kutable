import { getAdminClient } from '../../lib/supabase';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { barberId, serviceId } = body;

    if (!barberId || !serviceId) {
      return new Response(
        JSON.stringify({ error: 'barberId and serviceId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    // Check if there are any bookings for this service
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', serviceId)
      .eq('status', 'confirmed')
      .limit(1);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to check service bookings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (bookings && bookings.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete service with confirmed bookings. Deactivate it instead.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('barber_id', barberId); // Ensure barber owns this service

    if (error) {
      console.error('Error deleting service:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete service' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Services delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}