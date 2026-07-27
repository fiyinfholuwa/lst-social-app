import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRIENDSHIPS_KEY = '@lst_friendships';
const INITIAL_STATE = {
  friendIds: ['u2', 'u3'],
  outgoingRequestIds: [],
  incomingRequestIds: ['u5'],
  blockedUserIds: [],
};

const FriendshipsContext = createContext(null);

export function FriendshipsProvider({ children }) {
  const [friendships, setFriendships] = useState(INITIAL_STATE);
  const [friendshipsLoading, setFriendshipsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(FRIENDSHIPS_KEY)
      .then(value => setFriendships(value ? { ...INITIAL_STATE, ...JSON.parse(value) } : INITIAL_STATE))
      .catch(() => setFriendships(INITIAL_STATE))
      .finally(() => setFriendshipsLoading(false));
  }, []);

  const update = producer => {
    setFriendships(current => {
      const next = producer(current);
      AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const sendFriendRequest = userId => update(current => ({
    ...current,
    outgoingRequestIds: current.outgoingRequestIds.includes(userId)
      ? current.outgoingRequestIds
      : [...current.outgoingRequestIds, userId],
  }));

  const cancelFriendRequest = userId => update(current => ({
    ...current,
    outgoingRequestIds: current.outgoingRequestIds.filter(id => id !== userId),
  }));

  const acceptFriendRequest = userId => update(current => ({
    ...current,
    friendIds: current.friendIds.includes(userId) ? current.friendIds : [...current.friendIds, userId],
    outgoingRequestIds: current.outgoingRequestIds.filter(id => id !== userId),
    incomingRequestIds: current.incomingRequestIds.filter(id => id !== userId),
  }));

  const declineFriendRequest = userId => update(current => ({
    ...current,
    incomingRequestIds: current.incomingRequestIds.filter(id => id !== userId),
  }));

  const removeFriend = userId => update(current => ({
    ...current,
    friendIds: current.friendIds.filter(id => id !== userId),
  }));

  const blockUser = userId => update(current => ({
    ...current,
    friendIds: current.friendIds.filter(id => id !== userId),
    outgoingRequestIds: current.outgoingRequestIds.filter(id => id !== userId),
    incomingRequestIds: current.incomingRequestIds.filter(id => id !== userId),
    blockedUserIds: current.blockedUserIds?.includes(userId)
      ? current.blockedUserIds
      : [...(current.blockedUserIds || []), userId],
  }));

  const unblockUser = userId => update(current => ({
    ...current,
    blockedUserIds: (current.blockedUserIds || []).filter(id => id !== userId),
  }));

  const getRelationship = userId => {
    if (friendships.blockedUserIds?.includes(userId)) return 'blocked';
    if (friendships.friendIds.includes(userId)) return 'friends';
    if (friendships.outgoingRequestIds.includes(userId)) return 'outgoing';
    if (friendships.incomingRequestIds.includes(userId)) return 'incoming';
    return 'none';
  };

  const value = useMemo(() => ({
    ...friendships,
    friendshipsLoading,
    getRelationship,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
  }), [friendships, friendshipsLoading]);

  return <FriendshipsContext.Provider value={value}>{children}</FriendshipsContext.Provider>;
}

export const useFriendships = () => useContext(FriendshipsContext);
