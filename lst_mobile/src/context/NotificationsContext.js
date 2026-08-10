import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

const Context = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async (requestedPage = 1) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const response = await apiService.getNotifications(requestedPage);
      setNotifications(current => requestedPage === 1 ? response.data : [...current, ...response.data]);
      setUnreadCount(Number(response.unreadTotal || 0));
      setPage(response.currentPage);
      setHasMore(Boolean(response.hasMorePages));
    } catch (error) {
      console.error('Unable to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loading]);

  useEffect(() => {
    if (!user) {
      setNotifications([]); setUnreadCount(0); setPage(0); setHasMore(false);
      return;
    }
    loadNotifications(1);
  }, [user?.id]);

  const markAsRead = async id => {
    const item = notifications.find(notification => notification.id === String(id));
    await apiService.markNotificationRead(id);
    setNotifications(current => current.map(notification => notification.id === String(id) ? { ...notification, unread: false } : notification));
    if (item?.unread) setUnreadCount(current => Math.max(0, current - 1));
  };
  const markAllRead = async () => {
    await apiService.markAllNotificationsRead();
    setNotifications(current => current.map(notification => ({ ...notification, unread: false })));
    setUnreadCount(0);
  };
  const loadMore = useCallback(() => {
    if (hasMore && !loading) loadNotifications(page + 1);
  }, [hasMore, loading, loadNotifications, page]);

  const value = useMemo(() => ({ notifications, unreadCount, markAsRead, markAllRead, loadMore, loading, hasMore }), [notifications, unreadCount, loadMore, loading, hasMore]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useNotifications = () => useContext(Context);
