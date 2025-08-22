import { env } from '@/config/env';
import { API_BASE } from '@/lib/httpBase';

function readEnv(name: string): string | undefined {
  try { return (globalThis as any)?.process?.env?.[name]; } catch { return undefined; }
}

function resolveClientSupabaseUrl(): string | undefined {
  return (
    env.SUPABASE_URL ||
    readEnv('EXPO_PUBLIC_SUPABASE_URL') ||
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    readEnv('SUPABASE_URL')
  );
}

export async function assertSameSupabaseProject() {
  try {
    const clientUrl = resolveClientSupabaseUrl();
    const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';

    const url = `${API_BASE}/api/health/supabase`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      console.error('API health failed', { url, status: res.status, body: text?.slice(0,200) });
      return;
    }
    const j = await res.json().catch(()=> ({}));
    const serverHost = j?.serverHost || 'unknown';

    if (clientHost !== serverHost) {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
    }
  } catch (e) {
    console.error('API health fetch error', e);
  }
}