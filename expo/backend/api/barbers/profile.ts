import { getAdminClient } from '../../lib/supabase';
import { Barber, Service, GalleryItem } from '../../types';
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
      .order('price_cents');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch services' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch top gallery items (limit 6)
    const { data: galleryData, error: galleryError } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false })
      .limit(6);

    // Don't fail if gallery fails, just log it
    if (galleryError) {
      console.error('Gallery error:', galleryError);
    }

    const barber: Barber = mapBarberRowToBarber(barberData);
    const services: Service[] = (servicesData || []).map(mapServiceRowToService);
    
    const galleryTop: GalleryItem[] = (galleryData || []).map((g: any) => ({
      url: g.url,
      createdAtISO: g.created_at,
      path: g.path,
    }));

    // Combine into the expected format for the frontend
    const result = {
      ...barber,
      services,
      galleryTop: galleryTop.length > 0 ? galleryTop : undefined
    };

    return new Response(
      JSON.stringify(result),
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