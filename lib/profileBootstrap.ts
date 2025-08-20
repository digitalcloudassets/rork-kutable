import supabase from '@/lib/supabaseClient';

export async function ensureProfiles() {
  const { data:{ user } } = await supabase.auth.getUser(); 
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
}