import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/api';
import { getRole } from '@/lib/role';
import { useRouter, usePathname } from 'expo-router';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const r = useRouter(); const p = usePathname();

  useEffect(() => { (async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    const u = session?.user;
    if (!u) { setReady(true); return; }

    const role = getRole(u);

    if (role === 'barber') {
      try {
        const st = await apiClient.stripe.getAccountStatus({ barberId: u.id });
        const needs = !(st?.chargesEnabled && st?.payoutsEnabled);
        if (needs && !p?.startsWith('/onboarding')) r.replace('/onboarding/barber');
        if (!needs && p?.startsWith('/onboarding')) r.replace('/');
      } catch {
        if (!p?.startsWith('/onboarding')) r.replace('/onboarding/barber');
      }
    } else {
      if (p?.startsWith('/onboarding')) r.replace('/');
    }

    setReady(true);
  })(); }, [p, r]);

  if (!ready) return null;
  return <>{children}</>;
}