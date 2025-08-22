import { env } from '@/config/env';

export async function assertSameSupabaseProject() {
  try {
    const clientUrl =
      env.SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';

    const res = await fetch((env.API_URL || 'https://kutable.rork.app') + '/api/health/supabase');
    const j = await res.json().catch(() => ({}));
    const serverHost = j?.serverSupabaseHost || 'unknown';

    if (clientHost !== serverHost) {
      console.error('Supabase project mismatch', { clientHost, serverHost });
      // Optional: surface to UI once during dev
      // Alert.alert('Config error', `Client Supabase host ${clientHost} != server ${serverHost}`);
    }
  } catch {
    // ignore
  }
}