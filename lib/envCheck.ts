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

    const res = await fetch(`${apiBase}/api/health/supabase`, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      console.error('API health failed', { status: res.status, apiBase, text: text?.slice(0,200) });
      return; // don't log a fake mismatch when server isn't reachable
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