import { getAdminClient } from '../../lib/supabase';
import { Barber, Service } from '../../types';
import { mapBarberRowToBarber, mapServiceRowToService } from '../../adapters';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const barberId = url.searchParams.get('barberId');

    if (!barberId) {
      return new Response(
        JSON.stringify({ error: 'barberId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();

    // Fetch barber details
    const { data: barberData, error: barberError } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single();

    if (barberError || !barberData) {
      return new Response(
        JSON.stringify({ error: 'Barber not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch barber's active services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('barber_id', barberId)
      .eq('active', true)
      .order('name');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch services' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const barber: Barber = mapBarberRowToBarber(barberData);
    const services: Service[] = (servicesData || []).map(mapServiceRowToService);

    return new Response(
      JSON.stringify({ barber, services }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in barber profile endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}