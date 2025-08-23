// lib/api.ts
import { supabase } from '@/lib/supabaseClient';

const RAW =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

export const API_BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, '') : RAW;

// 🔐 last-resort public fallback (anon key is public, ok to embed)
const HARD_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdHhicG13YnlkZG13bWZ5bWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDE4NTUsImV4cCI6MjA3MTIxNzg1NX0.x8WslKawCcEoh9SzW8MnjHw63CLwH1CPoYyIAD4rJiI';

type StringHeaders = Record<string, string>;

async function authHeaders(): Promise<StringHeaders> {
  const { data: { session } } = await supabase.auth.getSession();
  const envAnon =
    (globalThis as any)?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (globalThis as any)?.process?.env?.SUPABASE_ANON;

  const token = (session?.access_token || envAnon || HARD_ANON) as string;
  if (!token) return {};
  return { Authorization: `Bearer ${token}`, apikey: String(token) };
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  // debug: show whether we attached Authorization
  if (typeof console !== 'undefined') console.log('[api post]', path, !!(headers as any).Authorization);
  return fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(payload) })
    .then((r) => toJson<T>(r));
}
async function getJson<T>(path: string): Promise<T> {
  const headers: HeadersInit = { ...(await authHeaders()) };
  if (typeof console !== 'undefined') console.log('[api get]', path, !!(headers as any).Authorization);
  return fetch(`${API_BASE}${path}`, { headers, cache: 'no-store' }).then((r) => toJson<T>(r));
}

type StripeStatus = {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

// Service types
type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  active: boolean;
};

type CreateServiceRequest = {
  barberId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
};

type UpdateServiceRequest = {
  id: string;
  barberId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  active?: boolean;
};

type AvailabilityBlock = {
  barberId: string;
  startISO: string;
  endISO: string;
  reason?: string;
};

export const apiClient = {
  misc: {
    // Reuse health for "ping" and "db"
    ping: () => getJson<{ serverHost: string }>(`/stripe-connect/health`),
    supabase: () => getJson<{ serverHost: string; canQuery: boolean }>(`/stripe-connect/health`),
    envdump: () => getJson<{ missing: Record<string, boolean> }>(`/stripe-connect/health`),
  },
  stripe: {
    createOrFetchAccount: (p: { barberId: string }) =>
      postJson<{ accountId: string }>(`/stripe-connect/create-or-fetch-account`, p),
    createAccountLink: (p: { barberId: string }) =>
      postJson<{ url: string }>(`/stripe-connect/account-link`, p),
    getAccountStatus: (p: { barberId: string }) =>
      getJson<StripeStatus>(`/stripe-connect/account-status?barberId=${encodeURIComponent(p.barberId)}`),
    health: () =>
      getJson<{ serverHost: string; canQuery: boolean; hasStripe: boolean }>(`/stripe-connect/health`),
  },
  services: {
    list: (p: { barberId: string }) =>
      postJson<{ services: Service[] }>(`/services/list`, p),
    create: (p: CreateServiceRequest) =>
      postJson<{ service: Service }>(`/services/create`, p),
    update: (p: UpdateServiceRequest) =>
      postJson<{ service: Service }>(`/services/update`, p),
    delete: (p: { barberId: string; serviceId: string }) =>
      postJson<{ ok: boolean }>(`/services/delete`, p),
    upsert: (p: { barberId: string; service: Partial<Service> & { name: string; durationMinutes: number; priceCents: number } }) =>
      postJson<{ service: Service }>(`/services/upsert`, p),
  },
  availability: {
    list: (p: { barberId: string; startISO?: string; endISO?: string }) =>
      postJson<{ blocks: any[] }>(`/availability/list`, p),
    block: (p: AvailabilityBlock) =>
      postJson<{ block: any }>(`/availability/block`, p),
    unblock: (p: { barberId: string; blockId: string }) =>
      postJson<{ ok: boolean }>(`/availability/unblock`, p),
    openSlots: (p: { barberId: string; date: string; serviceId?: string }) =>
      getJson<{ slots: string[] }>(`/availability/open-slots?barberId=${encodeURIComponent(p.barberId)}&date=${encodeURIComponent(p.date)}${p.serviceId ? `&serviceId=${encodeURIComponent(p.serviceId)}` : ''}`),
  },
  analytics: {
    summary: (p: { barberId: string; range: 'week' | 'month' }) =>
      postJson<{ bookingsCount: number; grossCents: number; netCents: number; avgTicketCents: number; cancellationsCount: number }>(`/analytics/summary`, p),
    timeseries: (p: { barberId: string; start: string; end: string; bucket: string }) =>
      postJson<{ timeSeries: { date: string; bookingsCount: number; grossCents: number }[] }>(`/analytics/timeseries`, p),
    topServices: (p: { barberId: string; range: 'month' }) =>
      postJson<{ topServices: { serviceId: string; serviceName: string; bookingsCount: number; grossCents: number }[] }>(`/analytics/top-services`, p),
  },
  earnings: {
    summary: (p: { barberId: string; range: 'today' | 'week' | 'month' }) =>
      postJson<{ gross: number; fees: number; net: number; range?: string }>(`/earnings/summary`, p),
  },
  payouts: {
    list: (p: { barberId: string }) =>
      postJson<{ id: string; amount: number; status: string; date: string; arrivalDate?: string }[]>(`/payouts/list`, p),
  },
  bookings: {
    list: (p: { userId?: string; barberId?: string }) =>
      postJson<any[]>(`/bookings/list`, p),
    cancel: (p: { bookingId: string; reason?: string; userId: string }) =>
      postJson<{ ok: boolean }>(`/bookings/cancel`, p),
    reschedule: (p: { bookingId: string; newStartISO: string; userId: string }) =>
      postJson<{ ok: boolean }>(`/bookings/reschedule`, p),
  },
  barbers: {
    search: (p: { query?: string; location?: string }) =>
      postJson<any[]>(`/barbers/search`, p),
  },
  test: () => ({ status: 'API client loaded successfully' }),
};

if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);