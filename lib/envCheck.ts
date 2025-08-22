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
    const res = await fetch(`${apiBase}/api/health/supabase`, { cache: 'no-store' });
    const j = await res.json().catch(() => ({}));
    const serverHost: string = j?.serverHost || 'unknown';

    if (clientHost !== serverHost) {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
      // Optional: surface to UI during dev with an Alert if you want.
    }
  } catch {
    console.warn('Supabase health check failed');
  }
}