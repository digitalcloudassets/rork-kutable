export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  DATA_MODE: (process.env.EXPO_PUBLIC_DATA_MODE || 'live') as 'live'|'mock',
};

export function validateEnv() {
  console.log('Environment validation:');
  console.log('API_URL:', env.API_URL);
  console.log('SUPABASE_URL:', env.SUPABASE_URL);
  console.log('SUPABASE_ANON:', env.SUPABASE_ANON ? '[SET]' : '[NOT SET]');
  console.log('DATA_MODE:', env.DATA_MODE);
  
  const missing = Object.entries(env).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.warn('Missing env variables:', missing.join(', '));
  } else {
    console.log('All environment variables are set');
  }
}