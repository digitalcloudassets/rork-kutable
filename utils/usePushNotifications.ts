import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { env } from '@/config/env';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationData {
  type: 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'payment_received' | 'new_booking';
  bookingId?: string;
  barberId?: string;
  clientId?: string;
  message: string;
}

export function usePushNotifications(user?: { id: string } | null) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const registerForPushNotifications = useCallback(async () => {
    // Disable push notifications in development to avoid project ID errors
    console.log('Push notifications disabled in development environment');
    return;
    
    // This code is currently disabled but kept for future use
    /*
    if (isRegistering || !user || Platform.OS === 'web') return;
    
    setIsRegistering(true);
    
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Get push token - remove hardcoded projectId to use app.json config
      const tokenData = await Notifications.getExpoPushTokenAsync();
      
      const token = tokenData.data;
      setExpoPushToken(token);
      console.log('Push token obtained:', token);

      // Store token on server
      if (token && user && user.id) {
        await storePushToken(user.id, token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    } finally {
      setIsRegistering(false);
    }
    */
  }, []);

  const storePushToken = async (userId: string, token: string) => {
    try {
      const apiUrl = env.API_URL || '';
      const response = await fetch(`${apiUrl}/api/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      });

      if (!response.ok) {
        throw new Error(`Failed to store push token: ${response.status}`);
      }

      console.log('Push token stored successfully');
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  };

  const sendPushNotification = useCallback(async ({
    to,
    title,
    body,
    data,
  }: {
    to: string;
    title: string;
    body: string;
    data?: NotificationData;
  }) => {
    try {
      const message = {
        to,
        sound: 'default',
        title,
        body,
        data,
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
      console.log('Push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }, []);

  // Set up notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data as unknown as NotificationData;
      
      // Handle notification tap based on type
      if (data?.type === 'new_booking' && data.bookingId) {
        // Navigate to booking details
        console.log('Navigate to booking:', data.bookingId);
      } else if (data?.type === 'booking_reminder' && data.bookingId) {
        // Navigate to booking details
        console.log('Navigate to booking reminder:', data.bookingId);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Auto-register when user is available
  useEffect(() => {
    if (user && Platform.OS !== 'web') {
      registerForPushNotifications();
    }
  }, [user, registerForPushNotifications]);

  return {
    expoPushToken,
    isRegistering,
    notification,
    registerForPushNotifications,
    sendPushNotification,
  };
}