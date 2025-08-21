import { env } from '@/config/env';

export async function api(path: string, init?: RequestInit) {
  const base = env.API_URL || 'https://kutable.rork.app';
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type':'application/json', ...(init?.headers||{}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json();
}