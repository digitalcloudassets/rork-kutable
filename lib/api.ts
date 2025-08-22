// lib/api.ts
import { supabase } from '@/lib/supabaseClient';

// ===== Base URL (your Edge Functions host) =====
const RAW =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

export const API_BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, '') : 'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

// ===== Helpers =====
async function authHeaders(): Promise<Record<string, string>> {
  try {
    // Prefer the signed-in user's JWT if available
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch { /* ignore */ }

  // Fallback to anon key for public calls (must be set in frontend env)
  const anon =
    (globalThis as any)?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    (globalThis as any)?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON ||
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (globalThis as any)?.process?.env?.SUPABASE_ANON;

  return anon ? { Authorization: `Bearer ${anon}` } : {};
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

type IdPayload = { barberId: string };

// Generic wrappers so we can await auth headers per call
async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const hdrs = await authHeaders();
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...hdrs },
    body: JSON.stringify(payload),
  }).then((res) => toJson<T>(res));
}

async function getJson<T>(path: string): Promise<T> {
  const hdrs = await authHeaders();
  return fetch(`${API_BASE}${path}`, {
    headers: { ...hdrs },
    cache: 'no-store',
  }).then((res) => toJson<T>(res));
}

// ===== Public API =====
export const apiClient = {
  stripe: {
    // POST /stripe-connect/create-or-fetch-account
    createOrFetchAccount: (payload: IdPayload) =>
      postJson(`/stripe-connect/create-or-fetch-account`, payload),

    // POST /stripe-connect/account-link
    createAccountLink: (payload: IdPayload) =>
      postJson(`/stripe-connect/account-link`, payload),

    // GET /stripe-connect/account-status?barberId=...
    getAccountStatus: (q: IdPayload) =>
      getJson(`/stripe-connect/account-status?barberId=${encodeURIComponent(q.barberId)}`),

    // GET /stripe-connect/health
    health: () => getJson(`/stripe-connect/health`),
  },
};

// One-time debug so you can confirm the base
if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);