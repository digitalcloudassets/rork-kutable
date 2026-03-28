-- Bookings table for storing appointment bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone_e164 TEXT,
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded', 'rescheduled')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Barbers can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = barber_id);

CREATE POLICY "Clients can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Barbers can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = barber_id);

CREATE POLICY "Clients can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Anyone can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON public.bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_utc ON public.bookings(start_utc);
CREATE INDEX IF NOT EXISTS idx_bookings_end_utc ON public.bookings(end_utc);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_time ON public.bookings(barber_id, start_utc, end_utc);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON public.bookings(payment_intent_id);

-- Constraint to prevent overlapping bookings for the same barber
CREATE UNIQUE INDEX idx_bookings_no_overlap ON public.bookings(barber_id, start_utc, end_utc)
WHERE status NOT IN ('cancelled', 'refunded');