import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const NOTIFICATIONS_KEY = '@lst_notifications';
const NotificationsContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    icon: 'users',
    title: 'Explore your communities',
    message: 'Find a mentorship or support community that fits your current season.',
    time: 'Just now',
    unread: true,
    screen: 'MainTabs',
  },
  {
    id: 'n2',
    icon: 'heart',
    title: 'Welcome to LST Social',
    message: 'Your faith community is ready. Share an encouragement or connect with others.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 'n3',
    icon: 'user-plus',
    title: 'New friend request',
    message: 'David Eze sent you a friend request.',
    time: 'Yesterday',
    unread: false,
    screen: 'FriendRequests',
  },
  {
    id: 'n4',
    icon: 'book-open',
    title: 'Continue growing',
    message: 'Take a moment today to read, reflect, and encourage someone.',
    time: '2d ago',
    unread: false,
  },
];

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY)
      .then(value => {
        if (value) setNotifications(JSON.parse(value));
      })
      .catch(() => setNotifications(INITIAL_NOTIFICATIONS));
  }, []);

  const updateNotifications = producer => {
    setNotifications(current => {
      const next = producer(current);
      AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markAsRead = notificationId => updateNotifications(current => current.map(item => (
    item.id === notificationId ? { ...item, unread: false } : item
  )));

  const markAllRead = () => updateNotifications(current => current.map(item => ({ ...item, unread: false })));

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter(item => item.unread).length,
    markAsRead,
    markAllRead,
  }), [notifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
