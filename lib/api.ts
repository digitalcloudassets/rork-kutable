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

// API Client with organized endpoints
export const apiClient = {
  // Test endpoint to verify client is working
  test: () => {
    console.log('API Client is working!');
    return { working: true };
  },
  // Services endpoints
  services: {
    list: async ({ barberId }: { barberId: string }) => {
      return api('/api/services/list', {
        method: 'POST',
        body: JSON.stringify({ barberId }),
      });
    },
    create: async (data: any) => {
      return api('/api/services/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (data: any) => {
      return api('/api/services/update', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    toggle: async (data: any) => {
      return api('/api/services/toggle', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async ({ barberId, serviceId }: { barberId: string; serviceId: string }) => {
      return api('/api/services/delete', {
        method: 'DELETE',
        body: JSON.stringify({ barberId, serviceId }),
      });
    },
  },

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

  // Bookings endpoints
  bookings: {
    list: async ({ barberId, userId }: { barberId?: string; userId?: string }) => {
      return api('/api/bookings/list', {
        method: 'POST',
        body: JSON.stringify({ barberId, userId }),
      });
    },
    create: async (data: any) => {
      return api('/api/bookings/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    cancel: async (data: any) => {
      return api('/api/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    reschedule: async (data: any) => {
      return api('/api/bookings/reschedule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Availability endpoints
  availability: {
    list: async (params: any) => {
      return api('/api/availability/list', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    openSlots: async (params: any) => {
      const searchParams = new URLSearchParams(params);
      return api(`/api/availability/open-slots?${searchParams.toString()}`);
    },
    block: async (data: any) => {
      return api('/api/availability/block', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    unblock: async (data: { barberId: string; blockId: string }) => {
      return api(`/api/availability/block/${data.blockId}?barberId=${data.barberId}`, {
        method: 'DELETE',
      });
    },
  },

  // Earnings endpoints
  earnings: {
    summary: async ({ barberId, range }: { barberId: string; range: string }) => {
      return api(`/api/earnings/summary?barberId=${barberId}&range=${range}`);
    },
  },

  // Payouts endpoints
  payouts: {
    list: async ({ barberId }: { barberId: string }) => {
      return api(`/api/payouts/list?barberId=${barberId}`);
    },
  },

  // Payments endpoints
  payments: {
    createIntent: async ({ bookingId }: { bookingId: string }) => {
      return api('/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
    },
  },

  // Barbers endpoints
  barbers: {
    search: async (params: any = {}) => {
      return api('/api/barbers/search', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },

  // Health/Diagnostics endpoints
  health: {
    ping: async () => {
      return api('/api/health/ping');
    },
    dbDiag: async () => {
      return api('/api/diag/db');
    },
  },
};

// Export the apiClient as default as well for compatibility
export default apiClient;