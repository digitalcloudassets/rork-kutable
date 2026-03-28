import { getAdminClient } from '../../lib/supabase';
import { mapServiceRowToService } from '../../adapters';
import type { Service } from '../../types';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { barberId, service } = body;

    if (!barberId || !service) {
      return new Response(
        JSON.stringify({ error: 'barberId and service are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required service fields
    if (!service.name || !service.durationMinutes || service.priceCents === undefined) {
      return new Response(
        JSON.stringify({ error: 'Service name, durationMinutes, and priceCents are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    const serviceData = {
      barber_id: barberId,
      name: service.name,
      duration_minutes: service.durationMinutes,
      price_cents: service.priceCents,
      description: service.description || null,
      active: service.active !== undefined ? service.active : true,
      updated_at: new Date().toISOString(),
    };

    let result;
    
    if (service.id) {
      // Update existing service
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', service.id)
        .eq('barber_id', barberId) // Ensure barber owns this service
        .select()
        .single();
      
      if (error) {
        console.error('Error updating service:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update service' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      result = data;
    } else {
      // Create new service
      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating service:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create service' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      result = data;
    }

    const serviceResponse: Service = mapServiceRowToService(result);

    return new Response(
      JSON.stringify({ service: serviceResponse }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Services upsert error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}