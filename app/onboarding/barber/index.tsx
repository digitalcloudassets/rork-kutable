import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/api';

import { BRAND } from '@/config/brand';
import { CheckCircle, CreditCard, ExternalLink } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession(); // makes return flow smoother on iOS

type Step = 'profile' | 'payments' | 'done';

export default function BarberOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [barberId, setBarberId] = useState<string | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user;
        if (u) {
          setBarberId(u.id);
          setName(String(u.user_metadata?.name ?? u.email?.split('@')[0] ?? ''));
          setEmail(u.email ?? '');
        } else {
          console.log('No user session found in onboarding');
          // Redirect to auth if no session
          router.replace('/auth/barber-signup');
        }
      } catch (error) {
        console.error('Error getting session in onboarding:', error);
        router.replace('/auth/barber-signup');
      }
    })();
  }, [router]);

  const saveProfile = async () => {
    try {
      setLoading(true);
      if (!barberId) throw new Error('Not signed in');

      // Optional: persist name changes to barbers table (guarded by RLS)
      const { error } = await supabase.from('barbers').update({ name }).eq('id', barberId);
      if (error) {
        console.log('Could not update barber name (table may not exist):', error.message);
      }

      setStep('payments');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  const pollStripeStatus = async (barberId: string) => {
    const start = Date.now();
    while (Date.now() - start < 90000) {
      const st = await apiClient.stripe.getAccountStatus({ barberId });
      if (st?.chargesEnabled && st?.payoutsEnabled) {
        setStep('done');
        Alert.alert('Connected', 'Payouts enabled. You\'re ready to accept payments.');
        return;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    Alert.alert('Still connecting', 'Finish Stripe onboarding to enable payouts.');
  };

  const openStripeOnboarding = useCallback(async () => {
    try {
      if (!barberId) throw new Error('Not signed in');
      setLoading(true);

      await apiClient.stripe.createOrFetchAccount({ barberId });
      const { url, fallback } = await apiClient.stripe.createAccountLink({ barberId });

      // Build the redirectUrl (must match your scheme)
      const redirectUrl = Linking.createURL('/onboarding/stripe/return'); // kutable://onboarding/stripe/return

      // Use Auth Session so the browser closes and returns to app automatically
      const res = await WebBrowser.openAuthSessionAsync(url, redirectUrl, {
        preferEphemeralSession: Platform.OS === 'ios',
        showInRecents: true,
      });

      // Possible results: "success" (returned via deep link), "cancel", "dismiss"
      if (res.type === 'success' || res.type === 'dismiss') {
        // On iOS "success" includes a url; on Android you may get "dismiss"
        await pollStripeStatus(barberId);
      } else if (res.type === 'cancel') {
        // User closed early — still attempt a quick status check
        await pollStripeStatus(barberId);
      } else {
        // Fallback: open in system browser
        await Linking.openURL(fallback?.return || url);
      }
    } catch (e: any) {
      Alert.alert('Stripe', e?.message || 'Could not open Stripe');
    } finally {
      setLoading(false);
    }
  }, [barberId]);



  const handleContinue = () => {
    if (step === 'done') {
      router.replace('/(tabs)/dashboard');
    } else {
      router.replace('/(tabs)/dashboard'); // Allow skipping
    }
  };

  if (step === 'profile') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Set up your Profile', headerBackTitle: 'Back' }} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Set up your Barber Profile</Text>
            <Text style={styles.subtitle}>Your name will appear to clients. You can change this later.</Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barber Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                autoCapitalize="words"
                style={styles.input}
                testID="name-input"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={saveProfile}
            disabled={loading}
            testID="continue-button"
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Saving…' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'payments') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Connect Payments', headerBackTitle: 'Back' }} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <CreditCard size={48} color={BRAND.ACCENT} />
            </View>
            <Text style={styles.title}>Connect payouts with Stripe</Text>
            <Text style={styles.subtitle}>
              Stripe Connect is how you get paid. We&apos;ll take you to Stripe to verify your identity and
              set your payout bank. It&apos;s secure and takes a few minutes.
            </Text>
          </View>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={BRAND.ACCENT} />
              <Text style={styles.featureText}>Accept credit card payments</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={BRAND.ACCENT} />
              <Text style={styles.featureText}>Automatic payouts to your bank</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={BRAND.ACCENT} />
              <Text style={styles.featureText}>Secure payment processing</Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={openStripeOnboarding}
              disabled={loading}
              testID="connect-stripe-button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <ExternalLink size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Connect with Stripe</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContinue}
              testID="skip-button"
            >
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.disclaimer}>
            You can come back here anytime to finish. We&apos;ll enable payments after you complete onboarding.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Setup Complete', headerBackTitle: 'Back' }} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CheckCircle size={48} color={BRAND.ACCENT} />
          </View>
          <Text style={styles.title}>All set 🎉</Text>
          <Text style={styles.subtitle}>
            Payouts are enabled. You&apos;re ready to take bookings and accept payments.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          testID="dashboard-button"
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.ACCENT + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: BRAND.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
    marginTop: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: BRAND.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#202633',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: BRAND.SURFACE_DARK,
    color: BRAND.TEXT_PRIMARY,
  },
  emailText: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
    padding: 16,
    backgroundColor: BRAND.SURFACE_DARK,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#202633',
  },
  features: {
    backgroundColor: BRAND.SURFACE_DARK,
    borderRadius: 12,
    padding: 20,
    marginVertical: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: BRAND.TEXT_SECONDARY,
    marginLeft: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BRAND.ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: BRAND.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  disclaimer: {
    fontSize: 13,
    color: BRAND.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
});