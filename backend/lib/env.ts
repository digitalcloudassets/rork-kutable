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

// Optional: set your project URL as a non-secret fallback (to kill "unknown")
const HARD_FALLBACK_SUPABASE_URL = 'https://wktxbpmwbyddmwmfymlh.supabase.co';

type EnvVals = {
  supabaseUrl: string;
  supabaseServiceKey: string | null;
  stripeSecret: string | null;
  appBaseUrl: string;
  appScheme: string;
  appHost: string;
};

function fromProcess(name: string): string | undefined {
  try { 
    const env = (globalThis as any)?.process?.env;
    return env?.[name]; 
  } catch { 
    return undefined; 
  }
}

export function resolveEnv(bindings?: Bindings): EnvVals {
  const pick = (...names: string[]) => {
    for (const name of names) {
      // Try bindings first (Cloudflare Workers)
      const bindingValue = bindings?.[name as keyof Bindings] as string | undefined;
      if (bindingValue && String(bindingValue).trim()) {
        return String(bindingValue).trim();
      }
      
      // Try process.env (Node.js)
      const processValue = fromProcess(name);
      if (processValue && String(processValue).trim()) {
        return String(processValue).trim();
      }
    }
    return undefined;
  };

  const supabaseUrl =
    pick('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL') ||
    HARD_FALLBACK_SUPABASE_URL; // <- ensures serverHost is never "unknown"

  const supabaseServiceKey =
    pick('SUPABASE_SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY') || null;

  const stripeSecret = pick('STRIPE_SECRET_KEY') || null;

  const appBaseUrl = pick('APP_BASE_URL') || 'https://kutable.rork.app';
  const appScheme  = pick('APP_SCHEME')  || 'kutable';
  const appHost    = pick('APP_HOST')    || 'kutable.rork.app';

  return { supabaseUrl, supabaseServiceKey, stripeSecret, appBaseUrl, appScheme, appHost };
}

export function supabaseHost(url: string): string {
  try { return new URL(url).host; } catch { return 'unknown'; }
}