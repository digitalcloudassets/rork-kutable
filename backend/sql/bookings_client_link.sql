-- Add client_user_id column to bookings table to link bookings to registered clients
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance when filtering by client_user_id
CREATE INDEX IF NOT EXISTS idx_bookings_client_user_id ON public.bookings(client_user_id);

-- Update RLS policies to allow clients to see their own bookings
CREATE POLICY "Clients can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = client_user_id);

-- Allow clients to create bookings for themselves
CREATE POLICY "Clients can create bookings for themselves" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = client_user_id OR client_user_id IS NULL);