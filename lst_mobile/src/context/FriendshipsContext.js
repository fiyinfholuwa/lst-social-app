import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

const EMPTY = {
  friendIds: [],
  outgoingRequestIds: [],
  incomingRequestIds: [],
  blockedUserIds: [],
};

const Context = createContext(EMPTY);

const normalizeIds = value => (Array.isArray(value) ? value.map(String) : []);

const normalizeState = value => ({
  friendIds: normalizeIds(value?.friendIds),
  outgoingRequestIds: normalizeIds(value?.outgoingRequestIds),
  incomingRequestIds: normalizeIds(value?.incomingRequestIds),
  blockedUserIds: normalizeIds(value?.blockedUserIds),
});

export function FriendshipsProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(EMPTY);
  const [friendshipsLoading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setState(EMPTY);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    apiService.getFriendships()
      .then(response => {
        if (active) setState(normalizeState(response));
      })
      .catch(error => {
        console.error('Unable to load friendships:', error);
        if (active) setState(EMPTY);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  const run = async (id, action) => {
    const response = action === 'request'
      ? await apiService.sendFriendRequest(id)
      : await apiService.updateRelationship(id, action);
    setState(normalizeState(response));
  };

  const getRelationship = id => {
    const userId = String(id);
    if (state.blockedUserIds.includes(userId)) return 'blocked';
    if (state.friendIds.includes(userId)) return 'friends';
    if (state.outgoingRequestIds.includes(userId)) return 'outgoing';
    if (state.incomingRequestIds.includes(userId)) return 'incoming';
    return 'none';
  };

  const value = useMemo(() => ({
    ...state,
    friendshipsLoading,
    getRelationship,
    sendFriendRequest: id => run(id, 'request'),
    cancelFriendRequest: id => run(id, 'cancel'),
    acceptFriendRequest: id => run(id, 'accept'),
    declineFriendRequest: id => run(id, 'decline'),
    removeFriend: id => run(id, 'remove'),
    blockUser: id => run(id, 'block'),
    unblockUser: id => run(id, 'unblock'),
  }), [state, friendshipsLoading]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useFriendships = () => useContext(Context);
