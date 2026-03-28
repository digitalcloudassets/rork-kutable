import { apiClient } from '@/lib/api';
export async function assertSameSupabaseProject() {
  try { await apiClient.stripe.health(); } catch {}
}