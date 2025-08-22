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
import { ensureProfiles } from '@/lib/profileBootstrap';

import { brandConfig, BRAND } from '../../config/brand';

export default function BarberSignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);




  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !shopName.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting barber signup process...');
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'barber',
            name,
            phone,
            shopName,
          },
        },
      });

      if (error) throw error;

      // Reinforce metadata to ensure it's set properly
      await supabase.auth.updateUser({ 
        data: { role: 'barber', name, phone, shopName } 
      });
      
      // Ensure profile exists
      await ensureProfiles('barber');
      
      // Navigate to onboarding - AuthProvider will handle routing logic
      router.replace('/onboarding/barber');
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Sign up failed', error?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Barber Sign Up', headerBackTitle: 'Back' }} />
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
            <Text style={styles.title}>Join as a Barber</Text>
            <Text style={styles.subtitle}>Start earning with your skills</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  testID="name-input"
                />
              </View>

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
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  testID="phone-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="Enter your shop name"
                  autoCapitalize="words"
                  testID="shop-name-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry
                  testID="password-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  testID="confirm-password-input"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              testID="signup-button"
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Barber Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Sign In</Text>
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
    backgroundColor: BRAND.BG_DARK,
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
    color: BRAND.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
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
  signUpButton: {
    backgroundColor: BRAND.ACCENT,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
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
    color: BRAND.TEXT_SECONDARY,
  },
  linkText: {
    fontSize: 16,
    color: BRAND.ACCENT,
    fontWeight: '600' as const,
  },
});