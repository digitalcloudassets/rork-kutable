import { env } from '@/config/env';

export async function api(path: string, init?: RequestInit) {
  const base = env.API_URL || 'https://kutable.rork.app';
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type':'application/json', ...(init?.headers||{}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${path} ${res.status} ${body || ''}`.trim());
  }
  return res.json();
}

// API Client with only essential endpoints (Stripe)
export const apiClient = {
  // Stripe endpoints
  stripe: {
    createOrFetchAccount: async ({ barberId }: { barberId: string }) => {
      return api('/api/stripe/create-or-fetch-account', {
        method: 'POST',
        body: JSON.stringify({ barberId }),
      });
    },
    createAccountLink: async ({ barberId }: { barberId: string }) => {
      return api('/api/stripe/account-link', {
        method: 'POST',
        body: JSON.stringify({ barberId }),
      });
    },
    getAccountStatus: async ({ barberId }: { barberId: string }) => {
      return api(`/api/stripe/account-status?barberId=${encodeURIComponent(barberId)}`, { method: 'GET' });
    },
  },

  // Health endpoints for diagnostics
  health: {
    ping: async () => {
      return api('/api/ping');
    },
    supabase: async () => {
      return api('/api/health/supabase');
    },
    envdump: async () => {
      return api('/api/health/envdump');
    },
  },
};

// Export the apiClient as default as well for compatibility
export default apiClient;