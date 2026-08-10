import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { openPushDestination } from '../navigation/navigationRef';
import { registerForPushNotifications, storePushToken } from '../services/pushNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PushNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    let active = true;

    registerForPushNotifications()
      .then(async token => {
        if (!active || !token) return;
        await storePushToken(token);
      })
      .catch(error => console.warn('Push notification registration failed:', error.message));

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      openPushDestination(response.notification.request.content.data);
    });

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (active && response) openPushDestination(response.notification.request.content.data);
    });

    return () => {
      active = false;
      responseSubscription.remove();
    };
  }, [user?.id]);

  return null;
}
