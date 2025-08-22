import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

type Role = 'barber' | 'client';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function toPlainError(err: any) {
  if (!err) return { message: 'Unknown error' };
  if (err.message) return { message: err.message, code: err.code, details: err.details, hint: err.hint };
  try { return JSON.parse(JSON.stringify(err)); } catch { return { message: String(err) }; }
}

function nameFromMeta(meta: any, email?: string | null) {
  const m = meta || {};
  const raw = m.name ?? m.full_name ?? m.fullName ?? null;
  if (raw && String(raw).trim()) return String(raw).trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return 'Barber';
}

export async function ensureProfiles(desiredRole?: Role, sessionUser?: any) {
  // 1) Get the current user from the same project the client is authenticated to
  let user = sessionUser;
  if (!user) {
    const { data: { session }, error: sErr } = await supabase.auth.getSession();
    if (sErr) { console.error('ensureProfiles session error', toPlainError(sErr)); return; }
    user = session?.user || (await supabase.auth.getUser()).data.user;
  }
  if (!user) { console.log('ensureProfiles: no user'); return; }

  const role: Role = desiredRole ?? (user.user_metadata?.role === 'barber' ? 'barber' : 'client');

  if (role !== 'barber') {
    // client branch left unchanged
    return;
  }

  // 2) If barber already exists, exit
  {
    const { data: existing, error } = await supabase
      .from('barbers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!error && existing) return;
  }

  // 3) Build payload with non-null name
  const payload = {
    id: user.id,
    email: user.email ?? null,
    name: nameFromMeta(user.user_metadata, user.email), // barbers.name is NOT NULL
  };

  // 4) Use admin client pointing to the EXACT same project URL as client
  const serviceUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  const admin = (serviceUrl && serviceKey)
    ? createClient(serviceUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

  // 5) Retry a few times for the rare case where auth.users row lags creation
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const clientToUse = admin ?? supabase; // prefer admin to bypass RLS
    const { error } = await clientToUse.from('barbers').insert(payload);

    if (!error) {
      console.log('Barber profile created');
      return;
    }

    const plain = toPlainError(error);
    console.error(`Barber insert attempt ${attempt} failed`, plain);

    // Detect FK failure that indicates project mismatch or early insert
    if (plain.code === '23503') {
      if (attempt < maxAttempts) {
        // short backoff for auth.users visibility
        await sleep(400 * attempt);
        continue;
      }
      console.error('FK 23503 persisted. Likely Supabase project mismatch between client and server.');
    }
    // For any other error, retry a couple times then give up
    if (attempt < maxAttempts) {
      await sleep(300 * attempt);
      continue;
    }
    console.error('ensureProfiles: insert barber error after all retries', plain);
    return;
  }
}