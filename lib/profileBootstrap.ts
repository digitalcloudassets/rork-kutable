import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function ensureProfiles() {
  try {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping profile creation');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: b } = await supabase.from('barbers').select('id').eq('id', user.id).maybeSingle();
    if (!b) {
      await supabase.from('barbers').insert({ 
        id: user.id, 
        email: user.email ?? null, 
        name: user.user_metadata?.full_name ?? null 
      });
    }
    
    const { data: c } = await supabase.from('clients').select('id').eq('id', user.id).maybeSingle();
    if (!c) {
      await supabase.from('clients').insert({ 
        id: user.id, 
        email: user.email ?? null, 
        name: user.user_metadata?.full_name ?? null 
      });
    }
  } catch (error) {
    console.error('Error ensuring profiles:', error);
    // Don't throw - this is a non-critical operation
  }
}