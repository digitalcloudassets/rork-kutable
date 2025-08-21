export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  DATA_MODE: (process.env.EXPO_PUBLIC_DATA_MODE || 'mock') as 'live'|'mock', // Default to mock mode
};

export function validateEnv() {
  const missing = Object.entries(env).filter(([key, value]) => {
    // Don't require environment variables if we're in mock mode
    if (env.DATA_MODE === 'mock') return false;
    return !value && key !== 'DATA_MODE';
  }).map(([k]) => k);
  
  if (missing.length && env.DATA_MODE === 'live') {
    console.warn('Missing environment variables for live mode:', missing.join(', '));
    console.warn('Switching to mock mode. To use live mode, set these environment variables.');
    // Force mock mode if required env vars are missing
    (env as any).DATA_MODE = 'mock';
  }
  
  // Validate Supabase URL format if provided
  if (env.SUPABASE_URL && !env.SUPABASE_URL.includes('supabase.co')) {
    console.warn('SUPABASE_URL appears to be invalid. Expected format: https://your-project.supabase.co');
  }
  
  console.log('Environment configuration:', {
    DATA_MODE: env.DATA_MODE,
    hasApiUrl: !!env.API_URL,
    hasSupabaseUrl: !!env.SUPABASE_URL,
    hasSupabaseAnon: !!env.SUPABASE_ANON,
  });
  
  return missing.length === 0 || env.DATA_MODE === 'mock';
}