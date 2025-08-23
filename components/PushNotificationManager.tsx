import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePushNotifications } from '@/utils/usePushNotifications';

export function PushNotificationManager() {
  const { user, ready } = useAuth();
  const { registerForPushNotifications } = usePushNotifications(user);

  useEffect(() => {
    // Safety guard: only register if auth is ready and we have a user
    if (ready && user) {
      registerForPushNotifications();
    }
  }, [ready, user, registerForPushNotifications]);

  return null; // This component doesn't render anything
}