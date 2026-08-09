import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

const Context = createContext({ unreadChatCount: 0, refreshUnreadChats: async () => {} });

export function ChatUnreadProvider({ children }) {
  const { user } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChats = useCallback(async () => {
    if (!user) {
      setUnreadChatCount(0);
      return 0;
    }
    try {
      const count = await apiService.getUnreadChatCount();
      setUnreadChatCount(count);
      return count;
    } catch (error) {
      console.error('Unable to load unread chats:', error);
      return 0;
    }
  }, [user?.id]);

  useEffect(() => {
    refreshUnreadChats();
    const timer = setInterval(refreshUnreadChats, 15000);
    return () => clearInterval(timer);
  }, [refreshUnreadChats]);

  const value = useMemo(() => ({ unreadChatCount, refreshUnreadChats }), [unreadChatCount, refreshUnreadChats]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useChatUnread = () => useContext(Context);
