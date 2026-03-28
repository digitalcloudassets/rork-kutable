-- Services table for storing barber services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Barbers can view their own services" ON public.services
  FOR SELECT USING (auth.uid() = barber_id);

CREATE POLICY "Barbers can insert their own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = barber_id);

CREATE POLICY "Barbers can update their own services" ON public.services
  FOR UPDATE USING (auth.uid() = barber_id);

CREATE POLICY "Barbers can delete their own services" ON public.services
  FOR DELETE USING (auth.uid() = barber_id);

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (active = true);

-- Trigger to update updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_barber_id ON public.services(barber_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
CREATE INDEX IF NOT EXISTS idx_services_barber_active ON public.services(barber_id, active);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services(price_cents);
CREATE INDEX IF NOT EXISTS idx_services_duration ON public.services(duration_minutes);