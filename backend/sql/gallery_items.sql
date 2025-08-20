-- Gallery items table for barber photo uploads
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  path text NOT NULL, -- Storage path like 'gallery/{barberId}/{uuid}.jpg'
  url text NOT NULL, -- Public URL to the image
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_barber_id ON gallery_items(barber_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_items(created_at DESC);

-- Unique constraint on path to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_path_unique ON gallery_items(path);

-- Storage bucket policy (run this in Supabase SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('barber-gallery', 'barber-gallery', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy for public read access
-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'barber-gallery');

-- Storage policy for authenticated upload (barbers only)
-- CREATE POLICY "Barber upload access" ON storage.objects FOR INSERT 
-- WITH CHECK (bucket_id = 'barber-gallery' AND auth.role() = 'authenticated');

-- Storage policy for barber delete access
-- CREATE POLICY "Barber delete access" ON storage.objects FOR DELETE 
-- USING (bucket_id = 'barber-gallery' AND auth.role() = 'authenticated');