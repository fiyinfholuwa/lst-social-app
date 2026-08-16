import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { useFriendships } from '../context/FriendshipsContext';
import { useNotifications } from '../context/NotificationsContext';
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
  const { refreshFriendships } = useFriendships();
  const { refreshNotifications } = useNotifications();

  const refreshSocialState = useCallback(() => {
    if (!user) return;
    refreshFriendships({ silent: true });
    refreshNotifications();
  }, [user?.id, refreshFriendships, refreshNotifications]);

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
      refreshSocialState();
      openPushDestination(response.notification.request.content.data);
    });
    const receivedSubscription = Notifications.addNotificationReceivedListener(refreshSocialState);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshSocialState();
    });
    // Emulators cannot receive remote push notifications, so keep active sessions
    // current with a small fallback poll as well.
    const refreshTimer = setInterval(() => {
      if (AppState.currentState === 'active') refreshSocialState();
    }, 15000);

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (active && response) openPushDestination(response.notification.request.content.data);
    });

    return () => {
      active = false;
      responseSubscription.remove();
      receivedSubscription.remove();
      appStateSubscription.remove();
      clearInterval(refreshTimer);
    };
  }, [user?.id, refreshSocialState]);

  return null;
}
