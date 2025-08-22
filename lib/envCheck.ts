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
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('API health failed', { status: res.status, apiBase, text: text?.slice(0, 120) });
      return; // don't throw a fake mismatch when server isn't up
    }
    const j = await res.json().catch(() => ({}));
    const serverHost = j?.serverHost || 'unknown';

    if (clientHost !== serverHost) {
      console.error('ERROR Supabase project mismatch', { clientHost, serverHost });
    }
  } catch (e) {
    console.error('API health fetch error', e);
  }
}