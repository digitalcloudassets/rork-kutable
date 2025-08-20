import { getAdminClient } from '../../lib/supabase';
import type { GalleryItem, GalleryItemRow } from '../../types';

// Mock gallery data for demo purposes (fallback)
const mockGalleryItems: Record<string, GalleryItem[]> = {
  'barber-1': [
    {
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-15T10:30:00Z',
      path: 'gallery/barber-1/haircut-1.jpg'
    },
    {
      url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-14T15:20:00Z',
      path: 'gallery/barber-1/haircut-2.jpg'
    },
    {
      url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-13T09:45:00Z',
      path: 'gallery/barber-1/haircut-3.jpg'
    },
    {
      url: 'https://images.unsplash.com/photo-1622286346003-c3d4e9370c04?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-12T14:15:00Z',
      path: 'gallery/barber-1/haircut-4.jpg'
    }
  ],
  'barber-2': [
    {
      url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-16T11:00:00Z',
      path: 'gallery/barber-2/style-1.jpg'
    },
    {
      url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=400&fit=crop',
      createdAtISO: '2024-01-15T16:30:00Z',
      path: 'gallery/barber-2/style-2.jpg'
    }
  ]
};

export async function POST(request: Request) {
  try {
    const { barberId } = await request.json();
    
    if (!barberId) {
      return Response.json({ error: 'barberId is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    
    try {
      // Try to fetch from database
      const { data: galleryRows, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        // Fall back to mock data if database fails
        const items = mockGalleryItems[barberId] || [];
        return Response.json({ items });
      }

      // Transform database rows to API format
      const items: GalleryItem[] = (galleryRows || []).map((row: GalleryItemRow) => ({
        url: row.url,
        createdAtISO: row.created_at,
        path: row.path
      }));

      return Response.json({ items });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Fall back to mock data if database is unavailable
      const items = mockGalleryItems[barberId] || [];
      return Response.json({ items });
    }
  } catch (error) {
    console.error('Gallery list error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}