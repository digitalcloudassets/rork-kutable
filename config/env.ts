export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  DATA_MODE: (process.env.EXPO_PUBLIC_DATA_MODE || 'live') as 'live'|'mock',
};

export function validateEnv() {
  const missing = Object.entries(env).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.warn('Missing environment variables:', missing.join(', '));
    console.warn('This will cause API calls to fail and fallback to mock data.');
    console.warn('To fix this, ensure these environment variables are set in your .env file or deployment configuration.');
  }
  
  // Validate Supabase URL format if provided
  if (env.SUPABASE_URL && !env.SUPABASE_URL.includes('supabase.co')) {
    console.warn('SUPABASE_URL appears to be invalid. Expected format: https://your-project.supabase.co');
  }
  
  return missing.length === 0;
}