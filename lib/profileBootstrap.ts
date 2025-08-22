import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

type Role = 'barber' | 'client';

function safeString(v: any, fallback: string) {
  if (typeof v === 'string' && v.trim().length) return v.trim();
  return fallback;
}

function toName(meta: any, email?: string | null) {
  const fromMeta = meta?.name ?? meta?.full_name ?? meta?.fullName;
  if (fromMeta && String(fromMeta).trim()) return String(fromMeta).trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return 'Barber';
}

export async function ensureProfiles(desiredRole?: Role, sessionUser?: any) {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping profile creation');
      return;
    }

    let user = sessionUser;

    if (!user) {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error('ensureProfiles: session error', sessionErr);
        return;
      }
      if (session?.user) {
        user = session.user;
      } else {
        const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('ensureProfiles: getUser error', userErr);
          return;
        }
        user = currentUser;
      }
    }

    if (!user) {
      console.log('ensureProfiles: No authenticated user found');
      return;
    }

    const role: Role = desiredRole ?? (user.user_metadata?.role === 'barber' ? 'barber' : 'client');

    if (role === 'barber') {
      const { data: existing, error: selectError } = await supabase
        .from('barbers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (selectError?.code === '42P01') {
        console.log('Barbers table does not exist, skipping profile creation');
        return;
      }
      if (existing) {
        console.log('Barber profile already exists');
        return;
      }

      // Build non-null-safe payload
      const name = toName(user.user_metadata, user.email);
      const payload = {
        id: user.id,
        email: user.email ?? null,
        name: safeString(name, 'Barber'), // barbers.name is NOT NULL
      };

      // Prefer service role if available (bypass RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_ROLE;
      const serviceUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

      let insertErr: any = null;
      if (serviceRoleKey && serviceUrl) {
        try {
          const admin = createClient(serviceUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { error } = await admin.from('barbers').insert(payload);
          if (error) insertErr = error;
        } catch (e) {
          insertErr = e;
        }
      }

      if (insertErr) {
        console.error('ensureProfiles: insert barber error', insertErr);
        return;
      }

      if (!serviceRoleKey) {
        const { error } = await supabase.from('barbers').insert(payload);
        if (error) {
          console.error('ensureProfiles: insert barber error', error);
        } else {
          console.log('Barber profile created successfully');
        }
      } else {
        console.log('Barber profile created successfully (service role)');
      }
      return;
    }

    // Client branch (unchanged)
    const { data: existingClient, error: clientSelectError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (clientSelectError?.code === '42P01') {
      console.log('Clients table does not exist, skipping client profile creation');
      return;
    }
    if (existingClient) {
      console.log('Client profile already exists');
      return;
    }

    const clientName = toName(user.user_metadata, user.email);
    const clientPayload = {
      id: user.id,
      email: safeString(user.email, 'unknown@example.com'), // clients.email is NOT NULL UNIQUE
      name: safeString(clientName, 'Client'),               // clients.name is NOT NULL
    };

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.SUPABASE_SERVICE_ROLE;
    const serviceUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    let insertErr: any = null;
    if (serviceRoleKey && serviceUrl) {
      try {
        const admin = createClient(serviceUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { error } = await admin.from('clients').insert(clientPayload);
        if (error) insertErr = error;
      } catch (e) {
        insertErr = e;
      }
    }

    if (insertErr) {
      console.error('ensureProfiles: insert client error', insertErr);
      return;
    }

    if (!serviceRoleKey) {
      const { error } = await supabase.from('clients').insert(clientPayload);
      if (error) {
        console.error('ensureProfiles: insert client error', error);
      } else {
        console.log('Client profile created successfully');
      }
    } else {
      console.log('Client profile created successfully (service role)');
    }
  } catch (e) {
    console.error('ensureProfiles fatal:', e);
  }
}