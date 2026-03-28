const rawApi = process.env.EXPO_PUBLIC_API_URL;

function sanitizeApi(url?: string) {
  if (!url) return undefined;
  // If someone accidentally set exp:// or http://, force https://kutable.rork.app
  if (url.startsWith('exp://') || url.startsWith('http://')) return 'https://kutable.rork.app';
  return url;
}

export const env = {
  API_URL: sanitizeApi(rawApi) || 'https://kutable.rork.app',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  DATA_MODE: (process.env.EXPO_PUBLIC_DATA_MODE || 'live') as 'live'|'mock',
};

export function validateEnv() {
  const missing = Object.entries(env).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) console.warn('Missing env:', missing.join(', '));
  // Log final API base so we can see it's HTTPS
  console.log('API base:', env.API_URL);
}