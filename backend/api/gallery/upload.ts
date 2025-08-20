import type { GalleryItem } from '../../types';

// Mock upload endpoint for demo purposes
// In production, this would handle actual file uploads to Supabase storage
export async function POST(request: Request) {
  try {
    // For demo purposes, we'll simulate a successful upload
    // In a real implementation, you would:
    // 1. Parse the FormData to get the file, path, and barberId
    // 2. Upload the file to Supabase storage
    // 3. Save the record to the gallery_items table
    
    const mockItem: GalleryItem = {
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      createdAtISO: new Date().toISOString(),
      path: `gallery/mock/${Date.now()}.jpg`
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return Response.json({ item: mockItem });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}