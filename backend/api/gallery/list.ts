import type { GalleryItem } from '../../types';

// Mock gallery data for demo purposes
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

    // Return mock data for demo
    const items = mockGalleryItems[barberId] || [];
    
    return Response.json({ items });
  } catch (error) {
    console.error('Gallery list error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}