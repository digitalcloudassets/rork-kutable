import { getAdminClient } from '../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { barberId, path } = await request.json();
    
    if (!barberId || !path) {
      return Response.json({ error: 'barberId and path are required' }, { status: 400 });
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
      return Response.json({ error: 'Gallery item not found or unauthorized' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('barber-gallery')
      .remove([path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return Response.json({ error: 'Failed to delete from storage' }, { status: 500 });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('gallery_items')
      .delete()
      .eq('barber_id', barberId)
      .eq('path', path);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return Response.json({ error: 'Failed to delete from database' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Gallery delete error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}