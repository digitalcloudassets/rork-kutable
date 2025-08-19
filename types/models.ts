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

export interface EarningsSummary {
  grossCents: number;
  feesCents: number;
  netCents: number;
  range: "week" | "month" | "year";
}