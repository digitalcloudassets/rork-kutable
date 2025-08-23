// lib/api.ts
import { supabase } from '@/lib/supabaseClient';

const RAW =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

export const API_BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, '') : RAW;

type StringHeaders = Record<string, string>;

async function authHeaders(): Promise<StringHeaders> {
  const { data: { session } } = await supabase.auth.getSession();
  const envAnon =
    (globalThis as any)?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (globalThis as any)?.process?.env?.SUPABASE_ANON;
  const token = (session?.access_token || envAnon) as string | undefined;
  return token ? { Authorization: `Bearer ${token}`, apikey: String(token) } : {};
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const auth = await authHeaders();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...auth };
  return fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(payload) })
    .then((r) => toJson<T>(r));
}
async function getJson<T>(path: string): Promise<T> {
  const auth = await authHeaders();
  const headers: HeadersInit = { ...auth };
  return fetch(`${API_BASE}${path}`, { headers, cache: 'no-store' })
    .then((r) => toJson<T>(r));
}

type IdPayload = { barberId: string };

export const apiClient = {
  stripe: {
    createOrFetchAccount: (p: IdPayload) =>
      postJson<{ accountId: string }>(`/stripe-connect/create-or-fetch-account`, p),

    createAccountLink: (p: IdPayload) =>
      postJson<{ url: string }>(`/stripe-connect/account-link`, p),

    getAccountStatus: (p: IdPayload) =>
      getJson<{ chargesEnabled: boolean; payoutsEnabled: boolean }>(
        `/stripe-connect/account-status?barberId=${encodeURIComponent(p.barberId)}`
      ),

    health: () => getJson<{ serverHost: string; canQuery: boolean }>(`/stripe-connect/health`),
  },
};

if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);