import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

type Role = 'barber' | 'client';

export async function ensureProfiles(desiredRole?: Role) {
  try {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping profile creation');
      return;
    }
    
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error('ensureProfiles: getUser error', userErr);
      return;
    }
    if (!user) return;

    const role: Role =
      desiredRole ?? (user.user_metadata?.role === 'barber' ? 'barber' : 'client');

    console.log('ensureProfiles: Creating profile for role:', role, 'user:', user.id);

    if (role === 'barber') {
      const { data: existing } = await supabase
        .from('barbers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existing) {
        console.log('Creating barber profile for user:', user.id);
        const { error } = await supabase.from('barbers').insert({
          id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
        });
        if (error) {
          console.error('ensureProfiles: insert barber error', error);
          throw error;
        }
        console.log('Barber profile created successfully');
      } else {
        console.log('Barber profile already exists');
      }
      return;
    }

    // client branch
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingClient) {
      console.log('Creating client profile for user:', user.id);
      const { error } = await supabase.from('clients').insert({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
      });
      if (error) {
        console.error('ensureProfiles: insert client error', error);
        throw error;
      }
      console.log('Client profile created successfully');
    } else {
      console.log('Client profile already exists');
    }
  } catch (error) {
    console.error('ensureProfiles fatal:', error);
    throw error;
  }
}