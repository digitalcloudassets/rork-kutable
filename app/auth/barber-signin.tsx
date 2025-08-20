import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';
import { brandConfig, BRAND } from '@/config/brand';
import type { User } from '@/types/models';

// Safe brand constants with fallbacks
const BRAND_SAFE = {
  BG_DARK: (BRAND && BRAND.BG_DARK) || '#0E1117',
  SURFACE_DARK: (BRAND && BRAND.SURFACE_DARK) || '#151A21',
  TEXT_PRIMARY: (BRAND && BRAND.TEXT_PRIMARY) || '#F7F8FA',
  TEXT_SECONDARY: (BRAND && BRAND.TEXT_SECONDARY) || '#A6AEBC',
  ACCENT: (BRAND && BRAND.ACCENT) || '#7C5CFF',
} as const;

export default function BarberSignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const { setUser } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Fetch barber record from database
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (barberError) {
          console.error('Error fetching barber record:', {
            message: barberError.message,
            code: barberError.code,
            details: barberError.details,
            hint: barberError.hint,
            full: barberError
          });
          
          let errorMessage = 'Barber account not found. Please contact support.';
          if (barberError.message) {
            errorMessage = `Database error: ${barberError.message}`;
          }
          
          Alert.alert('Error', errorMessage);
          return;
        }

        // Create user object for local state
        const user: User = {
          id: authData.user.id,
          role: 'barber',
          name: barberData.name,
          phone: barberData.phone,
          email: authData.user.email || '',
        };

        setUser(user);

        // Check if barber has completed Stripe Connect onboarding
        if (!barberData.connected_account_id) {
          Alert.alert(
            'Setup Required',
            'Please complete your Stripe Connect setup to start receiving payments.',
            [{ 
              text: 'Continue Setup', 
              onPress: () => router.replace('/barber-onboarding')
            }]
          );
        } else {
          router.replace('/(tabs)/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Failed to sign in';
      
      if (error?.message) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Resend Email', 
                onPress: () => handleResendConfirmation()
              }
            ]
          );
          return;
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setIsResendingEmail(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Email Sent',
        'A new confirmation email has been sent to your email address. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      Alert.alert('Error', error.message || 'Failed to resend confirmation email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Barber Sign In', headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: brandConfig.logo }} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your barber account</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="email-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  testID="password-input"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              testID="signin-button"
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_SAFE.BG_DARK,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: BRAND_SAFE.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: BRAND_SAFE.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: BRAND_SAFE.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#202633',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: BRAND_SAFE.SURFACE_DARK,
    color: BRAND_SAFE.TEXT_PRIMARY,
  },
  signInButton: {
    backgroundColor: BRAND_SAFE.ACCENT,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: BRAND_SAFE.TEXT_SECONDARY,
  },
  linkText: {
    fontSize: 16,
    color: BRAND_SAFE.ACCENT,
    fontWeight: '600' as const,
  },
});