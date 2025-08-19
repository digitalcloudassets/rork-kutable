import { getAdminClient } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barberId, serviceId } = req.body;

    if (!barberId || !serviceId) {
      return res.status(400).json({ error: 'barberId and serviceId are required' });
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
      return res.status(500).json({ error: 'Failed to check service bookings' });
    }

    if (bookings && bookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete service with confirmed bookings. Deactivate it instead.' 
      });
    }

    // Delete the service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('barber_id', barberId); // Ensure barber owns this service

    if (error) {
      console.error('Error deleting service:', error);
      return res.status(500).json({ error: 'Failed to delete service' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Services delete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}