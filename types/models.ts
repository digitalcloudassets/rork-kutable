export interface Barber {
  id: string;
  name: string;
  photoUrl: string;
  bio?: string;
  shopName?: string;
  shopAddress?: string;
  phone?: string;
  services: Service[];
  connectedAccountId?: string;
  rating?: number;
  reviewCount?: number;
  galleryTop?: GalleryItem[];
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

export interface Booking {
  id: string;
  barberId: string;
  barberName?: string;
  serviceId: string;
  serviceName?: string;
  startISO: string;
  endISO: string;
  clientName: string;
  clientPhone: string;
  clientUserId?: string; // Link to auth.users.id for registered clients
  note?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentIntentId?: string;
  createdAtISO: string;
}

export interface AvailabilityBlock {
  id: string;
  barberId: string;
  startISO: string;
  endISO: string;
  reason?: string;
}

export interface User {
  id: string;
  role: "client" | "barber";
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
  range: "week" | "month" | "year";
}

export interface GalleryItem {
  url: string;
  createdAtISO: string;
  path: string;
}

export interface Review {
  id: string;
  bookingId: string;
  barberId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAtISO: string;
  serviceName?: string;
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