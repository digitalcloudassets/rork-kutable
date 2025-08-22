import { env } from '@/config/env';

function readEnv(name: string): string | undefined {
  try { return (globalThis as any)?.process?.env?.[name]; } catch { return undefined; }
}

const isHttp = (v?: string) => !!v && /^https?:\/\//i.test(v);

function resolveClientSupabaseUrl(): string | undefined {
  const cand =
    env.SUPABASE_URL ||
    readEnv('EXPO_PUBLIC_SUPABASE_URL') ||
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    readEnv('SUPABASE_URL');
  return cand;
}

function resolveApiBase(): string {
  const cand =
    env.API_URL ||
    readEnv('EXPO_PUBLIC_API_URL') ||
    readEnv('NEXT_PUBLIC_API_URL') ||
    readEnv('API_URL');

  // 🔒 never allow exp:// etc. Fallback to your deployed host.
  const base = isHttp(cand) ? cand! : 'https://kutable.rork.app';

  if (__DEV__) console.log('[envCheck] apiBase=', base);
  return base;
}

export async function assertSameSupabaseProject() {
  // Skip health check if backend is not accessible (common in development)
  const clientUrl = resolveClientSupabaseUrl();
  const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';
  const apiBase = resolveApiBase();

  if (__DEV__) {
    console.log('[envCheck] Client Supabase host:', clientHost);
    console.log('[envCheck] API base:', apiBase);
  }

  // Only perform health check if we're confident the backend should be accessible
  if (!apiBase.includes('localhost') && !apiBase.includes('127.0.0.1')) {
    if (__DEV__) {
      console.log('[envCheck] Skipping health check for remote backend in development');
    }
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const res = await fetch(`${apiBase}/api/health/supabase`, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (__DEV__) {
        console.log('[envCheck] Backend not responding properly, status:', res.status);
      }
      return;
    }
    
    const j = await res.json().catch(() => ({}));
    const serverHost = j?.serverHost || 'unknown';

    if (__DEV__) {
      console.log('[envCheck] Server Supabase host:', serverHost);
    }

    if (clientHost !== serverHost && serverHost !== 'unknown') {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
    } else if (__DEV__) {
      console.log('[envCheck] ✅ Supabase projects match');
    }
  } catch (e) {
    if (__DEV__) {
      const error = e as Error;
      if (error.name === 'AbortError') {
        console.log('[envCheck] Backend health check timed out (this is normal in development)');
      } else {
        console.log('[envCheck] Backend not accessible:', error.message);
      }
    }
  }
}