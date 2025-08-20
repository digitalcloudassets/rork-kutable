import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/providers/AuthProvider';

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

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useAuth();

  const registerForPushNotifications = useCallback(async () => {
    if (isRegistering || !user) return;
    
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

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your actual project ID
      });
      
      const token = tokenData.data;
      setExpoPushToken(token);

      // Store token on server
      if (token && user.id) {
        await storePushToken(user.id, token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    } finally {
      setIsRegistering(false);
    }
  }, [isRegistering, user]);

  const storePushToken = async (userId: string, token: string) => {
    try {
      const response = await fetch('/api/users/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      });

      if (!response.ok) {
        throw new Error('Failed to store push token');
      }

      console.log('Push token stored successfully');
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  };

  // Auto-register when user is available
  useEffect(() => {
    if (user && Platform.OS !== 'web') {
      registerForPushNotifications();
    }
  }, [user, registerForPushNotifications]);

  return {
    expoPushToken,
    isRegistering,
    registerForPushNotifications,
  };
}