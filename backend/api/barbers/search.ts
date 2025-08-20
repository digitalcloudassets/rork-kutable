import { getAdminClient } from '../../lib/supabase';
import { mapBarberRowToBarber, mapServiceRowToService } from '../../adapters';
import type { Barber } from '../../types';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { q, serviceId } = body;

    const supabase = getAdminClient();
    
    // Build the query
    let query = supabase
      .from('barbers')
      .select(`
        *,
        services!inner(*)
      `);

    // Apply search filters
    if (q) {
      query = query.or(`name.ilike.%${q}%,shop_name.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    if (serviceId) {
      query = query.eq('services.id', serviceId);
    }

    const { data: barberRows, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to search barbers' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group services by barber and convert to proper format
    const barberMap = new Map<string, any>();
    
    for (const row of barberRows || []) {
      const barberId = row.id;
      
      if (!barberMap.has(barberId)) {
        barberMap.set(barberId, {
          ...mapBarberRowToBarber(row),
          services: []
        });
      }
      
      if (row.services) {
        const service = mapServiceRowToService(row.services);
        if (service.active) {
          barberMap.get(barberId).services.push(service);
        }
      }
    }

    const barbers: Barber[] = Array.from(barberMap.values());

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