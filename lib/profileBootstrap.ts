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

    // If no user provided, try to get from current session
    if (!user) {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.error('ensureProfiles: session error', sessionErr);
          return;
        }
        if (session?.user) {
          user = session.user;
        }
      } catch (error) {
        console.error('ensureProfiles: failed to get session', error);
        return;
      }
    }

    if (!user) {
      console.log('ensureProfiles: No authenticated user found');
      return;
    }

    console.log(`ensureProfiles: Starting profile creation for ${desiredRole} user:`, user.id);
    
    // Wait for auth propagation - critical for new signups
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify user exists in auth.users table before proceeding
    let userVerified = false;
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      const serviceUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (serviceRoleKey && serviceUrl) {
        const admin = createClient(serviceUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        
        // Try up to 3 times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { data: authUser, error: authError } = await admin.auth.admin.getUserById(user.id);
          if (!authError && authUser?.user) {
            console.log(`User verified in auth.users table on attempt ${attempt}`);
            userVerified = true;
            break;
          }
          
          if (attempt < 3) {
            console.log(`User not found in auth.users table, attempt ${attempt}/3. Waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          } else {
            console.error('User still not found in auth.users table after all attempts:', authError);
          }
        }
      } else {
        console.log('No service role key available, skipping user verification');
        userVerified = true; // Assume verified if we can't check
      }
    } catch (e) {
      console.warn('Could not verify user in auth.users table:', e);
      userVerified = true; // Continue anyway
    }
    
    if (!userVerified) {
      console.error('Cannot create profile: user not found in auth.users table');
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
      let retryCount = 0;
      const maxRetries = 5; // Increased retries

      console.log('Attempting to create barber profile with payload:', payload);

      while (retryCount < maxRetries) {
        if (serviceRoleKey && serviceUrl) {
          try {
            const admin = createClient(serviceUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false },
            });
            const { error } = await admin.from('barbers').insert(payload);
            if (error) {
              insertErr = error;
              console.log(`Barber insert attempt ${retryCount + 1} failed (service role):`, error.code, error.message);
            } else {
              insertErr = null;
              console.log('✅ Barber profile created successfully (service role)');
              break;
            }
          } catch (e) {
            insertErr = e;
            console.log(`Barber insert attempt ${retryCount + 1} exception (service role):`, e);
          }
        } else {
          try {
            const { error } = await supabase.from('barbers').insert(payload);
            if (error) {
              insertErr = error;
              console.log(`Barber insert attempt ${retryCount + 1} failed (regular client):`, error.code, error.message);
            } else {
              insertErr = null;
              console.log('✅ Barber profile created successfully (regular client)');
              break;
            }
          } catch (e) {
            insertErr = e;
            console.log(`Barber insert attempt ${retryCount + 1} exception (regular client):`, e);
          }
        }

        // If foreign key constraint error or other retryable errors, wait and retry
        if ((insertErr?.code === '23503' || insertErr?.code === '23505') && retryCount < maxRetries - 1) {
          const waitTime = 1500 * (retryCount + 1); // Progressive backoff
          console.log(`Retrying barber profile creation (attempt ${retryCount + 2}/${maxRetries}) in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
        } else {
          break;
        }
      }

      if (insertErr) {
        console.error('❌ ensureProfiles: insert barber error after all retries', {
          code: insertErr?.code,
          message: insertErr?.message,
          details: insertErr?.details,
          hint: insertErr?.hint,
          userId: user.id,
          attempts: retryCount + 1
        });
        return;
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
    let retryCount = 0;
    const maxRetries = 5; // Increased retries

    console.log('Attempting to create client profile with payload:', clientPayload);

    while (retryCount < maxRetries) {
      if (serviceRoleKey && serviceUrl) {
        try {
          const admin = createClient(serviceUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { error } = await admin.from('clients').insert(clientPayload);
          if (error) {
            insertErr = error;
            console.log(`Client insert attempt ${retryCount + 1} failed (service role):`, error.code, error.message);
          } else {
            insertErr = null;
            console.log('✅ Client profile created successfully (service role)');
            break;
          }
        } catch (e) {
          insertErr = e;
          console.log(`Client insert attempt ${retryCount + 1} exception (service role):`, e);
        }
      } else {
        try {
          const { error } = await supabase.from('clients').insert(clientPayload);
          if (error) {
            insertErr = error;
            console.log(`Client insert attempt ${retryCount + 1} failed (regular client):`, error.code, error.message);
          } else {
            insertErr = null;
            console.log('✅ Client profile created successfully (regular client)');
            break;
          }
        } catch (e) {
          insertErr = e;
          console.log(`Client insert attempt ${retryCount + 1} exception (regular client):`, e);
        }
      }

      // If foreign key constraint error or other retryable errors, wait and retry
      if ((insertErr?.code === '23503' || insertErr?.code === '23505') && retryCount < maxRetries - 1) {
        const waitTime = 1500 * (retryCount + 1); // Progressive backoff
        console.log(`Retrying client profile creation (attempt ${retryCount + 2}/${maxRetries}) in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retryCount++;
      } else {
        break;
      }
    }

    if (insertErr) {
      console.error('❌ ensureProfiles: insert client error after all retries', {
        code: insertErr?.code,
        message: insertErr?.message,
        details: insertErr?.details,
        hint: insertErr?.hint,
        userId: user.id,
        attempts: retryCount + 1
      });
      return;
    }
  } catch (e) {
    console.error('ensureProfiles fatal:', e);
  }
}