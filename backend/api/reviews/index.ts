import { Hono } from 'hono';
import { getAdminClient } from '../../lib/supabase';
import type { ReviewRow, Review } from '../../types';

const app = new Hono();

// Create a review
app.post('/create', async (c) => {
  try {
    const { bookingId, barberId, clientId, clientName, rating, comment, serviceName } = await c.req.json();

    console.log('Creating review:', { bookingId, barberId, clientId, rating });

    // Validate required fields
    if (!bookingId || !barberId || !clientId || !clientName || !rating) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    // Check if booking exists and is completed
    const { data: booking, error: bookingError } = await getAdminClient()
      .from('bookings')
      .select('id, status, client_user_id')
      .eq('id', bookingId)
      .eq('barber_id', barberId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return c.json({ error: 'Booking not found' }, 404);
    }

    if (booking.status !== 'completed') {
      return c.json({ error: 'Can only review completed bookings' }, 400);
    }

    // Check if review already exists
    const { data: existingReview } = await getAdminClient()
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return c.json({ error: 'Review already exists for this booking' }, 400);
    }

    // Create the review
    const { data: reviewData, error: reviewError } = await getAdminClient()
      .from('reviews')
      .insert({
        booking_id: bookingId,
        barber_id: barberId,
        client_id: clientId,
        client_name: clientName,
        rating,
        comment: comment || null,
        service_name: serviceName || null,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return c.json({ error: 'Failed to create review' }, 500);
    }

    const review: Review = {
      id: reviewData.id,
      bookingId: reviewData.booking_id,
      barberId: reviewData.barber_id,
      clientId: reviewData.client_id,
      clientName: reviewData.client_name,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAtISO: reviewData.created_at,
      serviceName: reviewData.service_name,
    };

    return c.json({ review });
  } catch (error) {
    console.error('Error in create review:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// List reviews for a barber
app.post('/list', async (c) => {
  try {
    const { barberId, limit = 20, offset = 0 } = await c.req.json();

    console.log('Listing reviews for barber:', barberId);

    if (!barberId) {
      return c.json({ error: 'barberId is required' }, 400);
    }

    const { data: reviewsData, error } = await getAdminClient()
      .from('reviews')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return c.json({ error: 'Failed to fetch reviews' }, 500);
    }

    const reviews: Review[] = (reviewsData || []).map((row: ReviewRow) => ({
      id: row.id,
      bookingId: row.booking_id,
      barberId: row.barber_id,
      clientId: row.client_id,
      clientName: row.client_name,
      rating: row.rating,
      comment: row.comment,
      createdAtISO: row.created_at,
      serviceName: row.service_name,
    }));

    return c.json({ reviews });
  } catch (error) {
    console.error('Error in list reviews:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get review stats for a barber
app.post('/stats', async (c) => {
  try {
    const { barberId } = await c.req.json();

    console.log('Getting review stats for barber:', barberId);

    if (!barberId) {
      return c.json({ error: 'barberId is required' }, 400);
    }

    // Get rating distribution
    const { data: ratingsData, error: ratingsError } = await getAdminClient()
      .from('reviews')
      .select('rating')
      .eq('barber_id', barberId);

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      return c.json({ error: 'Failed to fetch ratings' }, 500);
    }

    const ratings = ratingsData || [];
    const totalReviews = ratings.length;

    if (totalReviews === 0) {
      return c.json({
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
    }

    const averageRating = ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews;
    
    const ratingDistribution = {
      1: ratings.filter((r: { rating: number }) => r.rating === 1).length,
      2: ratings.filter((r: { rating: number }) => r.rating === 2).length,
      3: ratings.filter((r: { rating: number }) => r.rating === 3).length,
      4: ratings.filter((r: { rating: number }) => r.rating === 4).length,
      5: ratings.filter((r: { rating: number }) => r.rating === 5).length,
    };

    return c.json({
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error in review stats:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Check if user can review a booking
app.post('/can-review', async (c) => {
  try {
    const { bookingId, clientId } = await c.req.json();

    console.log('Checking if can review:', { bookingId, clientId });

    if (!bookingId || !clientId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if booking exists and is completed
    const { data: booking, error: bookingError } = await getAdminClient()
      .from('bookings')
      .select('id, status, client_user_id')
      .eq('id', bookingId)
      .eq('client_user_id', clientId)
      .single();

    if (bookingError || !booking) {
      return c.json({ canReview: false, reason: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return c.json({ canReview: false, reason: 'Booking not completed' });
    }

    // Check if review already exists
    const { data: existingReview } = await getAdminClient()
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return c.json({ canReview: false, reason: 'Review already exists' });
    }

    return c.json({ canReview: true });
  } catch (error) {
    console.error('Error in can-review:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;