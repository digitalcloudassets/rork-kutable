-- Barbers table for storing barber profiles
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone_e164 TEXT,
  shop_name TEXT,
  bio TEXT,
  shop_address TEXT,
  photo_url TEXT,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  connected_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own barber profile" ON public.barbers;
DROP POLICY IF EXISTS "Users can update their own barber profile" ON public.barbers;
DROP POLICY IF EXISTS "Users can insert their own barber profile" ON public.barbers;
DROP POLICY IF EXISTS "Public can view barber profiles" ON public.barbers;

-- Policies
CREATE POLICY "Users can view their own barber profile" ON public.barbers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own barber profile" ON public.barbers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own barber profile" ON public.barbers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view barber profiles" ON public.barbers
  FOR SELECT USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_barbers_email ON public.barbers(email);
CREATE INDEX IF NOT EXISTS idx_barbers_phone ON public.barbers(phone_e164);
CREATE INDEX IF NOT EXISTS idx_barbers_shop_name ON public.barbers(shop_name);
CREATE INDEX IF NOT EXISTS idx_barbers_rating ON public.barbers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_barbers_connected_account ON public.barbers(connected_account_id);