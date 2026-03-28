import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/api';
import { ActivityIndicator, View, Text } from 'react-native';

export default function StripeReturn() {
  const r = useRouter();
  const [msg, setMsg] = useState('Checking Stripe status...');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      const id = session?.user?.id;
      if (!id) { r.replace('/onboarding/barber'); return; }

      // quick poll loop (up to ~20s)
      for (let i=0;i<10;i++) {
        try {
          const st = await apiClient.stripe.getAccountStatus({ barberId: id });
          if (st.chargesEnabled && st.payoutsEnabled) { r.replace('/'); return; }
          setMsg('Almost there — finishing onboarding…');
        } catch {
          setMsg('Waiting on Stripe…');
        }
        await new Promise(res => setTimeout(res, 2000));
        if (!alive) return;
      }
      r.replace('/onboarding/barber');
    })();
    return () => { alive = false; };
  }, []);

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:8 }}>
      <ActivityIndicator />
      <Text>{msg}</Text>
    </View>
  );
}