export type Bindings = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  APP_BASE_URL?: string;
  APP_SCHEME?: string;
  APP_HOST?: string;
};

const HARD_FALLBACK_SUPABASE_URL = 'https://wktxbpmwbyddmwmfymlh.supabase.co';

export function resolveEnv(b?: Bindings) {
  const gp = (n: string) => (globalThis as any)?.process?.env?.[n];
  const pick = (...names: string[]) =>
    names.map(n => (b?.[n as keyof Bindings] as string | undefined) ?? gp(n))
         .find(v => v && String(v).trim())?.toString().trim();

  return {
    supabaseUrl: pick('SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_URL') || HARD_FALLBACK_SUPABASE_URL,
    supabaseServiceKey: pick('SUPABASE_SERVICE_ROLE','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SERVICE_KEY') || '',
    stripeSecret: pick('STRIPE_SECRET_KEY') || '',
    appBaseUrl: pick('APP_BASE_URL') || 'https://kutable.rork.app',
    appScheme:  pick('APP_SCHEME')  || 'kutable',
    appHost:    pick('APP_HOST')    || 'kutable.rork.app',
  };
}
export const supabaseHost = (u: string) => { try { return new URL(u).host; } catch { return 'unknown'; } };