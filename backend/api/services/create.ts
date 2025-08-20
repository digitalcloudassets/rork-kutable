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
    const { barberId, name, durationMinutes, priceCents, description } = body;

    if (!barberId || !name || !durationMinutes || priceCents === undefined) {
      return new Response(
        JSON.stringify({ error: 'barberId, name, durationMinutes, and priceCents are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    const serviceData = {
      id: crypto.randomUUID(),
      barber_id: barberId,
      name: name.trim(),
      duration_minutes: parseInt(durationMinutes),
      price_cents: parseInt(priceCents),
      description: description?.trim() || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create service' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const service: Service = mapServiceRowToService(data);

    return new Response(
      JSON.stringify({ service }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Services create error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}