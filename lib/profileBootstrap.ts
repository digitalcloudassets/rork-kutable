import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

type Role = 'barber' | 'client';

export async function ensureProfiles(desiredRole?: Role, sessionUser?: any) {
  try {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping profile creation');
      return;
    }
    
    let user = sessionUser;
    
    // If no session user provided, try to get current user
    if (!user) {
      // First try to get session (more reliable than getUser)
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error('ensureProfiles: session error', sessionErr);
        return;
      }
      
      if (session?.user) {
        user = session.user;
      } else {
        // Fallback to getUser if no session
        const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('ensureProfiles: getUser error', userErr);
          // Don't try to recover from JWT errors - just skip profile creation
          console.log('No valid auth session found, skipping profile creation');
          return;
        }
        user = currentUser;
      }
    }
    
    if (!user) {
      console.log('ensureProfiles: No authenticated user found');
      return;
    }

    const role: Role =
      desiredRole ?? (user.user_metadata?.role === 'barber' ? 'barber' : 'client');

    console.log('ensureProfiles: Creating profile for role:', role, 'user:', user.id);

    if (role === 'barber') {
      // Check if barber profile already exists
      const { data: existing, error: selectError } = await supabase
        .from('barbers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('ensureProfiles: error checking existing barber:', selectError);
        // If it's a table not found error, skip profile creation
        if (selectError.code === '42P01') {
          console.log('Barbers table does not exist, skipping profile creation');
          return;
        }
      }

      if (!existing) {
        console.log('Creating barber profile for user:', user.id);
        // Try to use service role client if available, otherwise fall back to regular client
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
        let insertError: any = null;
        
        if (serviceRoleKey && process.env.EXPO_PUBLIC_SUPABASE_URL) {
          try {
            console.log('Attempting to create barber profile with service role client');
            const serviceRoleClient = createClient(
              process.env.EXPO_PUBLIC_SUPABASE_URL,
              serviceRoleKey,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                }
              }
            );
            
            const { error } = await serviceRoleClient.from('barbers').insert({
              id: user.id,
              email: user.email ?? null,
              name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Barber',
            });
            
            if (error) {
              console.log('Service role client failed, will try regular client');
              insertError = error;
            } else {
              console.log('Barber profile created successfully with service role');
              return;
            }
          } catch (serviceError) {
            console.log('Service role client creation failed:', serviceError);
            insertError = serviceError;
          }
        } else {
          console.log('Service role key not available, using regular client');
        }
        
        // Fall back to regular client
        console.log('Attempting to create barber profile with regular client');
        const { error: regularError } = await supabase.from('barbers').insert({
          id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Barber',
        });
        
        if (regularError) {
          console.error('ensureProfiles: insert barber error', regularError);
          console.error('Detailed barber error:', {
            message: regularError.message,
            code: regularError.code,
            details: regularError.details,
            hint: regularError.hint,
            userId: user.id,
            serviceRoleError: insertError ? JSON.stringify(insertError) : null
          });
          
          // Don't throw on RLS errors, just log them
          if (regularError.message?.includes('row-level security') || regularError.code === '42501') {
            console.log('RLS policy prevented barber profile creation, this may be expected during signup');
            return;
          }
          
          // Don't throw on table not found errors
          if (regularError.code === '42P01') {
            console.log('Barbers table does not exist, profile creation skipped');
            return;
          }
        } else {
          console.log('Barber profile created successfully with regular client');
        }
      } else {
        console.log('Barber profile already exists');
      }
      return;
    }

    // client branch
    const { data: existingClient, error: clientSelectError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (clientSelectError) {
      console.error('ensureProfiles: error checking existing client:', clientSelectError);
      // If it's a table not found error, skip profile creation
      if (clientSelectError.code === '42P01') {
        console.log('Clients table does not exist, skipping profile creation');
        return;
      }
    }

    if (!existingClient) {
      console.log('Creating client profile for user:', user.id);
      // Try to use service role client if available, otherwise fall back to regular client
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      let insertError: any = null;
      
      if (serviceRoleKey && process.env.EXPO_PUBLIC_SUPABASE_URL) {
        try {
          console.log('Attempting to create client profile with service role client');
          const serviceRoleClient = createClient(
            process.env.EXPO_PUBLIC_SUPABASE_URL,
            serviceRoleKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          );
          
          const { error } = await serviceRoleClient.from('clients').insert({
            id: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Client',
          });
          
          if (error) {
            console.log('Service role client failed, will try regular client');
            insertError = error;
          } else {
            console.log('Client profile created successfully with service role');
            return;
          }
        } catch (serviceError) {
          console.log('Service role client creation failed:', serviceError);
          insertError = serviceError;
        }
      } else {
        console.log('Service role key not available, using regular client');
      }
      
      // Fall back to regular client
      console.log('Attempting to create client profile with regular client');
      const { error: regularError } = await supabase.from('clients').insert({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Client',
      });
      
      if (regularError) {
        console.error('ensureProfiles: insert client error', regularError);
        console.error('Detailed client error:', {
          message: regularError.message,
          code: regularError.code,
          details: regularError.details,
          hint: regularError.hint,
          userId: user.id,
          serviceRoleError: insertError ? JSON.stringify(insertError) : null
        });
        
        // Don't throw on RLS errors, just log them
        if (regularError.message?.includes('row-level security') || regularError.code === '42501') {
          console.log('RLS policy prevented client profile creation, this may be expected during signup');
          return;
        }
        
        // Don't throw on table not found errors
        if (regularError.code === '42P01') {
          console.log('Clients table does not exist, profile creation skipped');
          return;
        }
      } else {
        console.log('Client profile created successfully with regular client');
      }
    } else {
      console.log('Client profile already exists');
    }
  } catch (error) {
    console.error('ensureProfiles fatal:', error);
    console.error('Fatal error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Don't re-throw the error to prevent app crashes
    console.log('Profile creation failed, but continuing with app initialization');
  }
}