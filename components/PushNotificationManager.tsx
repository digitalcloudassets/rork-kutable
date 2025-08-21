import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePushNotifications } from '@/utils/usePushNotifications';

export function PushNotificationManager() {
  const { user } = useAuth();
  const { registerForPushNotifications } = usePushNotifications(user);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user, registerForPushNotifications]);

  return null; // This component doesn't render anything
}