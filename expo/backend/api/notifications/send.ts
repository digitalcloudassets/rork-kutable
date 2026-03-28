import { getAdminClient } from '../../lib/supabase';

interface NotificationPayload {
  to: string;
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
    const { userId, notification }: { userId: string; notification: Omit<NotificationPayload, 'to'> } = await request.json();

    if (!userId || !notification) {
      return new Response(
        JSON.stringify({ error: 'userId and notification are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push token
    const supabase = getAdminClient();
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData?.token) {
      console.error('No push token found for user:', userId, tokenError);
      return new Response(
        JSON.stringify({ error: 'No push token found for user' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification via Expo
    const message = {
      to: tokenData.token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send push notification:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Push notification sent successfully:', result);
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send notification endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}