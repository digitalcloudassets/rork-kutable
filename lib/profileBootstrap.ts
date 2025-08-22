import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

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
      const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error('ensureProfiles: getUser error', userErr);
        // If JWT is invalid, try to get session instead
        if (userErr.message?.includes('JWT') || userErr.message?.includes('sub claim')) {
          console.log('JWT error detected, trying to get session instead');
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr || !session?.user) {
            console.error('ensureProfiles: session error', sessionErr);
            return;
          }
          user = session.user;
        } else {
          return;
        }
      } else {
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
        const { error } = await supabase.from('barbers').insert({
          id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Barber',
        });
        if (error) {
          console.error('ensureProfiles: insert barber error', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            userId: user.id
          });
          // Don't throw on RLS errors, just log them
          if (error.message?.includes('row-level security') || error.code === '42501') {
            console.log('RLS policy prevented barber profile creation, this may be expected during signup');
            return;
          }
          throw error;
        }
        console.log('Barber profile created successfully');
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
      const { error } = await supabase.from('clients').insert({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? 'Client',
      });
      if (error) {
        console.error('ensureProfiles: insert client error', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId: user.id
        });
        // Don't throw on RLS errors, just log them
        if (error.message?.includes('row-level security') || error.code === '42501') {
          console.log('RLS policy prevented client profile creation, this may be expected during signup');
          return;
        }
        throw error;
      }
      console.log('Client profile created successfully');
    } else {
      console.log('Client profile already exists');
    }
  } catch (error) {
    console.error('ensureProfiles fatal:', error);
    // Don't re-throw the error to prevent app crashes
    console.log('Profile creation failed, but continuing with app initialization');
  }
}