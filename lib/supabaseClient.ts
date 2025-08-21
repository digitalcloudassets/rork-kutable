import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('Supabase configuration missing:', {
    hasUrl: !!url,
    hasAnon: !!anon,
    url: url ? `${url.substring(0, 20)}...` : 'undefined'
  });
}

// Create a fallback client if configuration is missing
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnon = 'placeholder-anon-key';

export const supabase = createClient(url || fallbackUrl, anon || fallbackAnon, {
  auth: { 
    autoRefreshToken: true, 
    persistSession: true, 
    detectSessionInUrl: false, 
    storage: AsyncStorage 
  },
});

// Add error handling for invalid configuration
if (!url || !anon) {
  console.warn('Supabase client created with fallback configuration. Database operations will fail.');
}

export default supabase;