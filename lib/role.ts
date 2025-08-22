export type Role = 'barber' | 'client';
export const getRole = (u?: any): Role => u?.user_metadata?.role === 'barber' ? 'barber' : 'client';