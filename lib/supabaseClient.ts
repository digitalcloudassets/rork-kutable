import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import polyfill with error handling
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-url-polyfill/auto');
} catch (error) {
  console.warn('URL polyfill not available:', error);
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(url && anon);
}

// Create a dummy client if not configured to prevent crashes
const createSupabaseClient = () => {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - using mock client');
      // Return a mock client that won't crash
      return {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_NOT_CONFIGURED' } }),
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_NOT_CONFIGURED' } }),
          update: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_NOT_CONFIGURED' } }),
        }),
      } as any;
    }
    
    console.log('Creating Supabase client with URL:', url);
    const client = createClient(url!, anon!, {
      auth: { 
        autoRefreshToken: true, 
        persistSession: true, 
        detectSessionInUrl: false, 
        storage: AsyncStorage
      },
    });
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return mock client as fallback
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_ERROR' } }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_ERROR' } }),
        update: () => Promise.resolve({ data: null, error: { code: 'SUPABASE_ERROR' } }),
      }),
    } as any;
  }
};

let supabaseInstance: any;

try {
  supabaseInstance = createSupabaseClient();
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a minimal mock client as absolute fallback
  supabaseInstance = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'INIT_ERROR' } }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: { code: 'INIT_ERROR' } }),
      update: () => Promise.resolve({ data: null, error: { code: 'INIT_ERROR' } }),
    }),
  };
}

export const supabase = supabaseInstance;
export default supabase;