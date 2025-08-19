import { getAdminClient } from '../../lib/supabase';
import { mapServiceRowToService } from '../../adapters';
import type { Service } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barberId } = req.body;

    if (!barberId) {
      return res.status(400).json({ error: 'barberId is required' });
    }

    const supabase = getAdminClient();
    
    const { data: serviceRows, error } = await supabase
      .from('services')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }

    const services: Service[] = serviceRows.map(mapServiceRowToService);

    return res.status(200).json({ services });
  } catch (error) {
    console.error('Services list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}