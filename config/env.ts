export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  DATA_MODE: (process.env.EXPO_PUBLIC_DATA_MODE || 'live') as 'live'|'mock',
};

export function validateEnv() {
  const missing = Object.entries(env).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) console.warn('Missing env:', missing.join(', '));
}