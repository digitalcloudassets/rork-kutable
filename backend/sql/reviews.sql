-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Ensure one review per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_unique ON reviews(booking_id);

-- RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Barbers can read their own reviews
CREATE POLICY "Barbers can read their reviews" ON reviews
  FOR SELECT USING (barber_id = auth.uid());

-- Clients can read reviews for barbers they're viewing
CREATE POLICY "Clients can read barber reviews" ON reviews
  FOR SELECT USING (true); -- Public read for reviews

-- Clients can create reviews for their completed bookings
CREATE POLICY "Clients can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND client_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Clients can update their own reviews within 24 hours
CREATE POLICY "Clients can update their reviews" ON reviews
  FOR UPDATE USING (
    client_id = auth.uid() AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- Function to update barber rating when reviews change
CREATE OR REPLACE FUNCTION update_barber_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the barber's rating and review count
  UPDATE barbers 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews 
      WHERE barber_id = COALESCE(NEW.barber_id, OLD.barber_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE barber_id = COALESCE(NEW.barber_id, OLD.barber_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.barber_id, OLD.barber_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update barber rating
DROP TRIGGER IF EXISTS trigger_update_barber_rating_insert ON reviews;
CREATE TRIGGER trigger_update_barber_rating_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_barber_rating();

DROP TRIGGER IF EXISTS trigger_update_barber_rating_update ON reviews;
CREATE TRIGGER trigger_update_barber_rating_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_barber_rating();

DROP TRIGGER IF EXISTS trigger_update_barber_rating_delete ON reviews;
CREATE TRIGGER trigger_update_barber_rating_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_barber_rating();