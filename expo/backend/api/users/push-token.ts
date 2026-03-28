import { getAdminClient } from '../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json();

    if (!userId || !token) {
      return new Response(
        JSON.stringify({ error: 'userId and token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upsert push token for user
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Error storing push token:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store push token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in push-token endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}