import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { BRAND } from '@/config/brand';

export default function StripeReturn() {
  const router = useRouter();

  useEffect(() => {
    const handleReturn = async () => {
      try {
        console.log('Stripe return: checking session and status');
        
        const { data: { session } } = await supabase.auth.getSession();
        const barberId = session?.user?.id;
        
        if (!barberId) {
          console.log('No session found, redirecting to onboarding');
          router.replace('/onboarding/barber');
          return;
        }

        console.log('Checking Stripe account status for barber:', barberId);
        const status = await apiClient.stripe.getAccountStatus({ barberId });
        
        if (status?.chargesEnabled && status?.payoutsEnabled) {
          console.log('Stripe onboarding complete, redirecting to dashboard');
          router.replace('/(tabs)/dashboard');
        } else {
          console.log('Stripe onboarding incomplete, returning to onboarding');
          router.replace('/onboarding/barber');
        }
      } catch (error) {
        console.error('Error in Stripe return handler:', error);
        router.replace('/onboarding/barber');
      }
    };

    handleReturn();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={BRAND.ACCENT} />
        <Text style={styles.text}>Processing Stripe setup...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BG_DARK,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
});