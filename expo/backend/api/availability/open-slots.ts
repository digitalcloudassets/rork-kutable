import { getOpenSlots } from '../../availability';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return await getOpenSlots(request);
}