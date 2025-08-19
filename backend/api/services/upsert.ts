import { getAdminClient } from '../../lib/supabase';
import { mapServiceRowToService } from '../../adapters';
import type { Service } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barberId, service } = req.body;

    if (!barberId || !service) {
      return res.status(400).json({ error: 'barberId and service are required' });
    }

    // Validate required service fields
    if (!service.name || !service.durationMinutes || service.priceCents === undefined) {
      return res.status(400).json({ 
        error: 'Service name, durationMinutes, and priceCents are required' 
      });
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
        return res.status(500).json({ error: 'Failed to update service' });
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
        return res.status(500).json({ error: 'Failed to create service' });
      }
      
      result = data;
    }

    const serviceResponse: Service = mapServiceRowToService(result);

    return res.status(200).json({ service: serviceResponse });
  } catch (error) {
    console.error('Services upsert error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}