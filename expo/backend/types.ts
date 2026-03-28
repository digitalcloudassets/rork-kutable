export interface Barber {
  id: string;
  name: string;
  photoUrl: string;
  bio?: string;
  shopName?: string;
  shopAddress?: string;
  phone?: string;
  connectedAccountId?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  active: boolean;
}

export interface AvailabilityBlock {
  id: string;
  barberId: string;
  startISO: string;
  endISO: string;
  reason?: string;
}

export interface Booking {
  id: string;
  barberId: string;
  serviceId: string;
  startISO: string;
  endISO: string;
  clientName: string;
  clientPhone: string;
  clientUserId?: string; // Link to auth.users.id for registered clients
  note?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentIntentId?: string;
  createdAtISO: string;
}

export interface User {
  id: string;
  role: 'client' | 'barber';
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phoneE164?: string;
  photoUrl?: string;
}

export interface EarningsSummary {
  grossCents: number;
  feesCents: number;
  netCents: number;
  range: 'week' | 'month' | 'year';
}

// Database row types (what comes from Supabase)
export interface BarberRow {
  id: string;
  name: string;
  photo_url: string;
  bio?: string;
  shop_name?: string;
  shop_address?: string;
  phone?: string;
  connected_account_id?: string;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  barber_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlockRow {
  id: string;
  barber_id: string;
  start_utc: string;
  end_utc: string;
  reason?: string;
  created_at: string;
}

export interface BookingRow {
  id: string;
  barber_id: string;
  service_id: string;
  start_iso: string;
  end_iso: string;
  client_name: string;
  client_phone: string;
  client_user_id?: string; // Link to auth.users.id for registered clients
  note?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_intent_id?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: string;
  role: 'client' | 'barber';
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone_e164?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  url: string;
  createdAtISO: string;
  path: string;
}

export interface GalleryItemRow {
  id: string;
  barber_id: string;
  path: string;
  url: string;
  created_at: string;
}

export interface AnalyticsSummary {
  bookingsCount: number;
  grossCents: number;
  netCents: number;
  avgTicketCents: number;
  cancellationsCount: number;
  range: 'week' | 'month';
}

export interface TimeSeriesPoint {
  date: string;
  bookingsCount: number;
  grossCents: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  bookingsCount: number;
  grossCents: number;
}

export interface Review {
  id: string;
  bookingId: string;
  barberId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment?: string;
  createdAtISO: string;
  serviceName?: string;
}

export interface ReviewRow {
  id: string;
  booking_id: string;
  barber_id: string;
  client_id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: string;
  service_name?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}