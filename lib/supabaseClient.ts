import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON) {
  console.warn('Supabase env missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN apps don't use URL callbacks by default
    storage: AsyncStorage,     // Persist session across app restarts
  },
});

export default supabase;