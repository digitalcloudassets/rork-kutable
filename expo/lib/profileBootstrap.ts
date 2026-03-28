import { supabase } from '@/lib/supabaseClient';
import { getRole, Role } from '@/lib/role';

const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const toName=(m:any,e?:string|null)=> (m?.name||m?.full_name||m?.fullName|| e?.split('@')?.[0]) ?? 'User';

export async function ensureProfiles(desired?: Role, sessionUser?: any) {
  const { data:{ session } } = await supabase.auth.getSession();
  const user = sessionUser ?? session?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const role = desired ?? getRole(user);

  if (role === 'barber') {
    const { data: ex } = await supabase.from('barbers').select('id').eq('id', user.id).maybeSingle();
    if (ex) return;
    const p = { id: user.id, email: user.email ?? null, name: toName(user.user_metadata, user.email) };
    for (let i=1;i<=5;i++){ const { error } = await supabase.from('barbers').insert(p); if(!error) return; await sleep(200*i); }
    return;
  }

  const { data: ex } = await supabase.from('clients').select('id').eq('id', user.id).maybeSingle();
  if (ex) return;
  const p = { id: user.id, email: user.email ?? null, name: toName(user.user_metadata, user.email) };
  for (let i=1;i<=5;i++){ const { error } = await supabase.from('clients').insert(p); if(!error) return; await sleep(200*i); }
}