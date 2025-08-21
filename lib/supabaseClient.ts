import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';

const url = env.SUPABASE_URL;
const anon = env.SUPABASE_ANON;

if (!url || !anon) {
  console.log('Supabase configuration missing - app will run in offline mode:', {
    hasUrl: !!url,
    hasAnon: !!anon,
    dataMode: env.DATA_MODE
  });
}

// Create a fallback client if configuration is missing
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.M9jrxyvPLkUxWgOYSf5dNdJ8v_eRrZqCK8LUqzZqQwA';

export const supabase = createClient(url || fallbackUrl, anon || fallbackAnon, {
  auth: { 
    autoRefreshToken: !!url && !!anon, // Only auto-refresh if properly configured
    persistSession: true, 
    detectSessionInUrl: false, 
    storage: AsyncStorage 
  },
});

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => !!url && !!anon;

// Add error handling for invalid configuration
if (!url || !anon) {
  console.log('Supabase client created with fallback configuration. App will use mock data.');
}

export default supabase;