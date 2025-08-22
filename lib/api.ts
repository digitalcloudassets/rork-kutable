// lib/api.ts
// Uses Supabase Edge Functions as the API base.
// Expected env: EXPO_PUBLIC_API_URL=https://<project>.supabase.co/functions/v1

const RAW =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

// Force HTTPS and strip trailing slashes
export const API_BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, '') : 'https://wktxbpmwbyddmwmfymlh.supabase.co/functions/v1';

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} :: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

type IdPayload = { barberId: string };

export const apiClient = {
  stripe: {
    // POST /stripe-connect/create-or-fetch-account
    createOrFetchAccount: (payload: IdPayload) =>
      fetch(`${API_BASE}/stripe-connect/create-or-fetch-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(toJson),

    // POST /stripe-connect/account-link
    createAccountLink: (payload: IdPayload) =>
      fetch(`${API_BASE}/stripe-connect/account-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(toJson),

    // GET /stripe-connect/account-status?barberId=...
    getAccountStatus: (q: IdPayload) =>
      fetch(`${API_BASE}/stripe-connect/account-status?barberId=${encodeURIComponent(q.barberId)}`, {
        cache: 'no-store',
      }).then(toJson),

    // GET /stripe-connect/health
    health: () =>
      fetch(`${API_BASE}/stripe-connect/health`, { cache: 'no-store' })
        .then(toJson as <T>(r: Response) => Promise<T>),
  },
};

// One-time debug to confirm where the app is pointing
if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);

// Export the apiClient as default as well for compatibility
export default apiClient;