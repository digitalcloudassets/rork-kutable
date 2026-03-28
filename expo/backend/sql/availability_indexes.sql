-- Indexes for availability system performance
-- These indexes speed up availability queries by barber and time range

-- Index for availability_blocks table
CREATE INDEX IF NOT EXISTS idx_blocks_barber_time 
ON public.availability_blocks (barber_id, start_utc, end_utc);

-- Index for bookings table (for availability overlap checks)
CREATE INDEX IF NOT EXISTS idx_bookings_barber_time 
ON public.bookings (barber_id, start_utc, end_utc);

-- Additional index for booking status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_barber_status_time 
ON public.bookings (barber_id, status, start_utc, end_utc);