import { API_BASE } from '@/lib/httpBase';

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(()=> '');
    throw new Error(`${res.status} ${res.statusText} :: ${body.slice(0,200)}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  stripe: {
    createOrFetchAccount: (payload: { barberId: string }) =>
      fetch(`${API_BASE}/api/stripe/create-or-fetch-account`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload),
      }).then(toJson),
    createAccountLink: (payload: { barberId: string }) =>
      fetch(`${API_BASE}/api/stripe/account-link`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload),
      }).then(toJson),
    getAccountStatus: (q: { barberId: string }) =>
      fetch(`${API_BASE}/api/stripe/account-status?barberId=${encodeURIComponent(q.barberId)}`).then(toJson),
  },
};

// Export the apiClient as default as well for compatibility
export default apiClient;