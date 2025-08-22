// lib/httpBase.ts
const raw =
  (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.NEXT_PUBLIC_API_URL ||
  (globalThis as any)?.process?.env?.API_URL ||
  'https://kutable.rork.app';

export const API_BASE = /^https?:\/\//i.test(raw) ? raw.replace(/\/+$/,'') : 'https://kutable.rork.app';

// one-time debug
if (typeof console !== 'undefined') console.log('[API_BASE]', API_BASE);