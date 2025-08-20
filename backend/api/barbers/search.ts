import { getAdminClient } from '../../lib/supabase';
import { mapBarberRowToBarber, mapServiceRowToService } from '../../adapters';
import type { Barber } from '../../types';

export async function POST(request: Request): Promise<Response> {

  try {
    const body = await request.json();
    const { q, serviceId } = body;

    const supabase = getAdminClient();
    
    // Build the query - get all barbers first
    let barberQuery = supabase
      .from('barbers')
      .select('*');

    // Apply search filters on barbers
    if (q) {
      barberQuery = barberQuery.or(`name.ilike.%${q}%,shop_name.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    const { data: barberRows, error: barberError } = await barberQuery;

    if (barberError) {
      console.error('Database error:', barberError);
      return new Response(JSON.stringify({ error: 'Failed to search barbers' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!barberRows || barberRows.length === 0) {
      return new Response(JSON.stringify({ barbers: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get services for all barbers
    const barberIds = barberRows.map(b => b.id);
    let servicesQuery = supabase
      .from('services')
      .select('*')
      .in('barber_id', barberIds)
      .eq('active', true);

    // Apply service filter if specified
    if (serviceId) {
      servicesQuery = servicesQuery.eq('id', serviceId);
    }

    const { data: servicesRows, error: servicesError } = await servicesQuery;

    if (servicesError) {
      console.error('Services error:', servicesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch services' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group services by barber
    const servicesByBarber = new Map<string, any[]>();
    (servicesRows || []).forEach(service => {
      const barberId = service.barber_id;
      if (!servicesByBarber.has(barberId)) {
        servicesByBarber.set(barberId, []);
      }
      servicesByBarber.get(barberId)!.push(mapServiceRowToService(service));
    });

    // Build final barber list
    const barbers: Barber[] = [];
    
    for (const barberRow of barberRows) {
      const barberId = barberRow.id;
      const services = servicesByBarber.get(barberId) || [];
      
      // If filtering by service, only include barbers that have that service
      if (serviceId && services.length === 0) {
        continue;
      }
      
      const barber = mapBarberRowToBarber(barberRow);
      barbers.push({
        ...barber,
        services
      } as any);
    }



    return new Response(JSON.stringify({ barbers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search barbers error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}