-- Create availability_blocks table
CREATE TABLE IF NOT EXISTS public.availability_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    start_utc timestamptz NOT NULL,
    end_utc timestamptz NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_barber_id ON public.availability_blocks(barber_id);
CREATE INDEX IF NOT EXISTS idx_blocks_timerange ON public.availability_blocks USING gist (tstzrange(start_utc, end_utc));

-- Add constraint to ensure start_utc < end_utc
ALTER TABLE public.availability_blocks 
ADD CONSTRAINT check_start_before_end 
CHECK (start_utc < end_utc);

-- Optional: Enable RLS if you're using it
-- ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- Optional: Create RLS policies if needed
-- CREATE POLICY "Barbers can manage their own availability blocks" ON public.availability_blocks
--   FOR ALL USING (auth.uid() = barber_id);

COMMENT ON TABLE public.availability_blocks IS 'Stores time blocks when barbers are unavailable';
COMMENT ON COLUMN public.availability_blocks.barber_id IS 'Reference to the barber who owns this availability block';
COMMENT ON COLUMN public.availability_blocks.start_utc IS 'Start time of the unavailable period in UTC';
COMMENT ON COLUMN public.availability_blocks.end_utc IS 'End time of the unavailable period in UTC';
COMMENT ON COLUMN public.availability_blocks.reason IS 'Optional reason for the unavailability (e.g., lunch, break, vacation)';