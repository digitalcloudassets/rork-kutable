import { deleteAvailabilityBlock } from '../../../availability';

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const blockId = pathParts[pathParts.length - 1];

  if (request.method === 'DELETE') {
    return await deleteAvailabilityBlock(request, blockId);
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
}