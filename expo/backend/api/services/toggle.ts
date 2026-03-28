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
    const { id, barberId, active } = body;

    if (!id || !barberId || active === undefined) {
      return new Response(
        JSON.stringify({ error: 'id, barberId, and active are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getAdminClient();
    
    const { data, error } = await supabase
      .from('services')
      .update({ 
        active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('barber_id', barberId) // Ensure barber owns this service
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling service:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to toggle service' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const service: Service = mapServiceRowToService(data);

    return new Response(
      JSON.stringify({ service }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Services toggle error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}