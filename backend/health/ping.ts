/**
 * Simple ping endpoint for basic health check
 */
export default async function handler(req: Request): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: true }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}