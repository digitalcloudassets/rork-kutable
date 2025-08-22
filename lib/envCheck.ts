import { env } from '@/config/env';

// Safe accessor for environment variables without adding Node typings
function readEnv(name: string): string | undefined {
  try {
    const pe = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined;
    return pe?.[name];
  } catch {
    return undefined;
  }
}

function resolveClientSupabaseUrl(): string | undefined {
  // Prefer your typed env.SUPABASE_URL, then fall back to public envs
  return (
    env.SUPABASE_URL ||
    readEnv('EXPO_PUBLIC_SUPABASE_URL') ||
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ||
    readEnv('SUPABASE_URL')
  );
}

function resolveApiBase(): string {
  return (
    env.API_URL ||
    readEnv('EXPO_PUBLIC_API_URL') ||
    readEnv('NEXT_PUBLIC_API_URL') ||
    readEnv('API_URL') ||
    'https://kutable.rork.app'
  );
}

export async function assertSameSupabaseProject() {
  try {
    const clientUrl = resolveClientSupabaseUrl();
    const clientHost = clientUrl ? new URL(clientUrl).host : 'unknown';
    const apiBase = resolveApiBase();

    console.log('Checking API health:', { clientHost, apiBase });

    // First try a simple ping
    try {
      const pingRes = await fetch(`${apiBase}/api/ping`, { cache: 'no-store' });
      console.log('Ping response:', { status: pingRes.status, ok: pingRes.ok });
      if (!pingRes.ok) {
        const pingText = await pingRes.text().catch(() => '');
        console.error('Ping failed:', { status: pingRes.status, text: pingText?.slice(0, 120) });
      }
    } catch (pingError) {
      console.error('Ping fetch error:', pingError);
    }

    const res = await fetch(`${apiBase}/api/health/supabase`, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('API health failed', { status: res.status, apiBase, text: text?.slice(0, 120) });
      return; // don't throw a fake mismatch when server isn't up
    }
    
    const j = await res.json().catch(() => ({}));
    const serverHost = j?.serverHost || 'unknown';
    
    console.log('API health response:', { serverHost, canQueryBarbers: j?.canQueryBarbers });

    if (clientHost !== serverHost) {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
    } else {
      console.log('✅ Supabase project match confirmed');
    }
  } catch (e) {
    console.error('API health fetch error', e);
  }
}