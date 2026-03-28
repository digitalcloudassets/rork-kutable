import { getAdminClient } from '../../lib/supabase';

interface BulkNotificationPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: {
    type: 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'payment_received' | 'new_booking';
    bookingId?: string;
    barberId?: string;
    clientId?: string;
    message: string;
  };
}

export async function POST(request: Request) {
  try {
    const { userIds, title, body, data }: BulkNotificationPayload = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userIds (array), title, and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get push tokens for all users
    const supabase = getAdminClient();
    const { data: tokensData, error: tokensError } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tokensData || tokensData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No push tokens found for provided users' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare messages for all tokens
    const messages = tokensData.map(tokenData => ({
      to: tokenData.token,
      sound: 'default',
      title,
      body,
      data,
    }));

    // Send bulk notifications via Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send bulk push notifications:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send notifications', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bulk push notifications sent successfully:', result);
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        sentCount: messages.length,
        requestedCount: userIds.length 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in bulk send notification endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}