// lib/api.ts
import { supabase } from '@/lib/supabaseClient';

const RAW =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

export const API_BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, '') : RAW;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ||
    (globalThis as any)?.process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return token ? { Authorization: `Bearer ${token}`, apikey: token } : {};
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} :: ${(await res.text().catch(()=>''))?.slice(0,200)}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const h = await authHeaders();
  return fetch(`${API_BASE}${path}`, { method:'POST', headers:{ 'Content-Type':'application/json', ...h }, body: JSON.stringify(payload) })
    .then((r)=>toJson<T>(r));
}
async function getJson<T>(path: string): Promise<T> {
  const h = await authHeaders();
  return fetch(`${API_BASE}${path}`, { headers:{ ...h }, cache:'no-store' })
    .then((r)=>toJson<T>(r));
}

type IdPayload = { barberId: string };

export const apiClient = {
  stripe: {
    createOrFetchAccount: (p: IdPayload) => postJson(`/stripe-connect/create-or-fetch-account`, p),
    createAccountLink:     (p: IdPayload) => postJson(`/stripe-connect/account-link`, p),
    getAccountStatus:      (p: IdPayload) => getJson(`/stripe-connect/account-status?barberId=${encodeURIComponent(p.barberId)}`),
    health:                ()              => getJson(`/stripe-connect/health`),
  },
};

if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);