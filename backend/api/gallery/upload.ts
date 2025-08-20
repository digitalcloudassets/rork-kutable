// import { getAdminClient } from '../../lib/supabase';
import type { GalleryItem } from '../../types';

export default async function handler(request: Request): Promise<Response> {
  try {
    // For demo purposes, we'll simulate a successful upload
    // In a real implementation, you would parse FormData and upload to Supabase storage
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockItem: GalleryItem = {
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      createdAtISO: new Date().toISOString(),
      path: `gallery/mock/${Date.now()}.jpg`
    };

    return new Response(JSON.stringify({ item: mockItem }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // TODO: Implement real file upload when Supabase storage is configured
    // const formData = await request.formData();
    // const file = formData.get('file');
    // const path = formData.get('path');
    // const barberId = formData.get('barberId');
    // 
    // if (!file || !path || !barberId) {
    //   return Response.json({ error: 'file, path, and barberId are required' }, { status: 400 });
    // }

    // TODO: Implement real Supabase storage upload
    // const supabase = getAdminClient();
    // 
    // const { error: uploadError } = await supabase.storage
    //   .from('barber-gallery')
    //   .upload(path, file, { cacheControl: '3600', upsert: false });
    // 
    // if (uploadError) {
    //   console.error('Storage upload error:', uploadError);
    //   return Response.json({ error: 'Upload failed' }, { status: 500 });
    // }
    // 
    // const { data: urlData } = supabase.storage
    //   .from('barber-gallery')
    //   .getPublicUrl(path);
    // 
    // const { data: dbData, error: dbError } = await supabase
    //   .from('gallery_items')
    //   .insert({ barber_id: barberId, path, url: urlData.publicUrl })
    //   .select()
    //   .single();
    // 
    // if (dbError) {
    //   await supabase.storage.from('barber-gallery').remove([path]);
    //   return Response.json({ error: 'Failed to save gallery item' }, { status: 500 });
    // }
    // 
    // return Response.json({ 
    //   item: { url: dbData.url, createdAtISO: dbData.created_at, path: dbData.path } 
    // });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}