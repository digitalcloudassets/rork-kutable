import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getRole, type Role } from '@/lib/role';
import { apiClient } from '@/lib/api';
import { useRouter, usePathname } from 'expo-router';

type AuthCtx = {
  user: any | null;
  session: any | null;
  role: Role | null;
  ready: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, role: null, ready: false, refresh: async () => {},
});

// 👇 This is what other files import: useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // bootstrap + subscribe session
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(session ?? null);
      setRole(session?.user ? getRole(session.user) : null);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, sess: any) => {
      setSession(sess ?? null);
      setRole(sess?.user ? getRole(sess.user) : null);
    });

    return () => { alive = false; sub.subscription?.unsubscribe?.(); };
  }, []);

  // route-guard (barber → onboarding until payouts enabled; clients → avoid onboarding)
  useEffect(() => {
    (async () => {
      if (!ready) return;
      const u = session?.user;
      if (!u) return; // unauthenticated screens handle themselves

      const r = role ?? getRole(u);
      if (r === 'barber') {
        try {
          const st = await apiClient.stripe.getAccountStatus({ barberId: u.id });
          const needs = !(st?.chargesEnabled && st?.payoutsEnabled);
          if (needs && !pathname?.startsWith('/onboarding')) router.replace('/onboarding/barber');
          if (!needs && pathname?.startsWith('/onboarding')) router.replace('/');
        } catch {
          if (!pathname?.startsWith('/onboarding')) router.replace('/onboarding/barber');
        }
      } else {
        // client
        if (pathname?.startsWith('/onboarding')) router.replace('/');
      }
    })();
  }, [ready, role, session?.user, pathname, router]);

  const value = useMemo<AuthCtx>(() => ({
    user: session?.user ?? null,
    session,
    role,
    ready,
    refresh: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session ?? null);
      setRole(session?.user ? getRole(session.user) : null);
    },
  }), [session, role, ready]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}