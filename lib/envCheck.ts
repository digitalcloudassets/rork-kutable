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
  try {
    const clientUrl = resolveClientSupabaseUrl();
    const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';
    const apiBase = resolveApiBase();

    if (__DEV__) console.log('[envCheck] Testing API health at:', `${apiBase}/api/health/supabase`);

    const res = await fetch(`${apiBase}/api/health/supabase`, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      console.error('API health failed', { 
        status: res.status, 
        statusText: res.statusText,
        apiBase, 
        text: text?.slice(0,200) 
      });
      
      // Try envdump for more info
      try {
        const envRes = await fetch(`${apiBase}/api/health/envdump`, { cache: 'no-store' });
        if (envRes.ok) {
          const envData = await envRes.json();
          console.log('Backend env info:', envData);
        }
      } catch { /* ignore */ }
      
      return; // don't log a fake mismatch when server isn't reachable
    }
    
    const j = await res.json().catch(() => ({}));
    const serverHost = j?.serverHost || 'unknown';

    if (__DEV__) console.log('[envCheck] Hosts:', { clientHost, serverHost });

    if (clientHost !== serverHost && serverHost !== 'unknown') {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
    }
  } catch (e) {
    console.error('API health fetch error', e);
    if (__DEV__) {
      console.log('[envCheck] Full error details:', {
        message: (e as Error)?.message,
        name: (e as Error)?.name,
        stack: (e as Error)?.stack?.slice(0, 300)
      });
    }
  }
}