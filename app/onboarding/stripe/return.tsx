import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function StripeReturn() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    (async () => {
      if (!user?.id) return router.replace('/onboarding/barber');
      const st = await apiClient.stripe.getAccountStatus({ barberId: user.id });
      router.replace(st?.chargesEnabled && st?.payoutsEnabled ? '/' : '/onboarding/barber');
    })();
  }, [router, user?.id]);
  
  return null;
}