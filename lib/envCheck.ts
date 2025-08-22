import { env } from '@/config/env';
import { API_BASE } from '@/lib/httpBase';

function readEnv(n:string){ try { return (globalThis as any)?.process?.env?.[n]; } catch { return undefined; } }
function clientUrl(){ return env.SUPABASE_URL || readEnv('EXPO_PUBLIC_SUPABASE_URL') || readEnv('NEXT_PUBLIC_SUPABASE_URL') || readEnv('SUPABASE_URL'); }

export async function assertSameSupabaseProject() {
  try {
    const clientHost = clientUrl() ? new URL(clientUrl()!).host : 'unknown';
    const url = `${API_BASE}/api/health/supabase`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) { console.warn('API health failed', { url, status: res.status }); return; }
    const j = await res.json().catch(()=> ({}));
    const serverHost = j?.serverHost || 'unknown';
    if (clientHost !== serverHost) console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
  } catch { /* swallow to avoid breaking UI */ }
}