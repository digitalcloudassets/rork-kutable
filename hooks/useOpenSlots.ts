import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useOpenSlots(params: { barberId: string; serviceId?: string; dateYMD: string; }) {
  const { barberId, serviceId, dateYMD } = params;
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); 
      setErr(undefined);
      try {
        const q = new URLSearchParams({ barberId, date: dateYMD });
        if (serviceId) q.set('serviceId', serviceId);
        const res = await api(`/api/availability/open-slots?${q.toString()}`);
        if (!cancelled) setSlots(res.slots || []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load slots');
        setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [barberId, serviceId, dateYMD]);

  return { slots, loading, error: err };
}