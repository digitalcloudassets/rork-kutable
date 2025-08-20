import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Scissors, Users } from 'lucide-react-native';
import { brandConfig } from '@/config/brand';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: brandConfig.logo }} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>{brandConfig.name}</Text>
            <Text style={styles.subtitle}>
              Book appointments with top barbers or grow your business
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clientButton}
              onPress={() => router.push('/auth/client-signup')}
              testID="client-signup-button"
            >
              <View style={styles.buttonContent}>
                <Users size={24} color="#007AFF" />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonTitle}>I&apos;m a Client</Text>
                  <Text style={styles.buttonSubtitle}>Book appointments</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.barberButton}
              onPress={() => router.push('/auth/barber-signup')}
              testID="barber-signup-button"
            >
              <View style={styles.buttonContent}>
                <Scissors size={24} color="#fff" />
                <View style={styles.buttonText}>
                  <Text style={styles.barberButtonTitle}>I&apos;m a Barber</Text>
                  <Text style={styles.barberButtonSubtitle}>Grow my business</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <View style={styles.signInLinks}>
              <TouchableOpacity onPress={() => router.push('/auth/client-signin')}>
                <Text style={styles.linkText}>Client Sign In</Text>
              </TouchableOpacity>
              <Text style={styles.separator}> • </Text>
              <TouchableOpacity onPress={() => router.push('/auth/barber-signin')}>
                <Text style={styles.linkText}>Barber Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  clientButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  barberButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  barberButtonTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  barberButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  signInLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  separator: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});