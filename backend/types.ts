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
  start_iso: string;
  end_iso: string;
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
  note?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_intent_id?: string;
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