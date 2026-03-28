import { getAdminClient } from '../../lib/supabase';

export default async function handler(request: Request): Promise<Response> {
  try {
    const { barberId, path } = await request.json();
    
    if (!barberId || !path) {
      return new Response(JSON.stringify({ error: 'barberId and path are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAdminClient();
    
    // First, verify the item belongs to this barber
    const { data: item, error: fetchError } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('barber_id', barberId)
      .eq('path', path)
      .single();

    if (fetchError || !item) {
      return new Response(JSON.stringify({ error: 'Gallery item not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('barber-gallery')
      .remove([path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return new Response(JSON.stringify({ error: 'Failed to delete from storage' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('gallery_items')
      .delete()
      .eq('barber_id', barberId)
      .eq('path', path);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to delete from database' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gallery delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}