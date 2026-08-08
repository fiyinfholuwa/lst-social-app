import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [postsCount, setPostsCount] = useState(0);
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    getRelationship,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
  } = useFriendships();

  useEffect(() => {
    Promise.all([apiService.getUser(userId), apiService.getPosts()]).then(([person, posts]) => {
      setProfile(person);
      setPostsCount(posts.filter(post => String(post.userId) === String(userId)).length);
    });
  }, [userId]);

  if (!profile) return <Loader />;

  const relationship = getRelationship(userId);
  const isOwnProfile = String(userId) === String(user.id);
  const joinedCommunities = Array.isArray(profile.joinedCommunities) ? profile.joinedCommunities.map(String) : [];
  const ownCommunities = Array.isArray(user.joinedCommunities) ? user.joinedCommunities.map(String) : [];
  const sharedCommunities = joinedCommunities.filter(id => ownCommunities.includes(id)).length;

  const openChat = async () => {
    if (relationship !== 'friends') {
      Alert.alert('Friendship required', 'You can message this person after they accept your friend request.');
      return;
    }
    const chat = await apiService.getOrCreateChat(profile);
    navigation.navigate('ChatDetail', { chatId: chat.id, userName: profile.name });
  };

  const primaryAction = () => {
    if (relationship === 'blocked') return unblockUser(userId);
    if (relationship === 'friends') return openChat();
    if (relationship === 'incoming') return acceptFriendRequest(userId);
    if (relationship === 'outgoing') return undefined;
    return sendFriendRequest(userId);
  };

  const actionLabel = {
    friends: 'Message',
    incoming: 'Accept request',
    outgoing: 'Request sent',
    none: 'Add friend',
    blocked: 'Unblock account',
  }[relationship];

  const actionIcon = {
    friends: 'comment',
    incoming: 'user-check',
    outgoing: 'clock',
    none: 'user-plus',
    blocked: 'unlock',
  }[relationship];

  const confirmUnfriend = () => Alert.alert(
    `Unfriend ${profile.name}?`,
    'They will no longer be able to message you. You can send another friend request later.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unfriend', style: 'destructive', onPress: () => removeFriend(userId) },
    ],
  );

  const confirmCancelRequest = async () => {
    if (cancellingRequest) return;
    setCancellingRequest(true);
    try {
      await cancelFriendRequest(userId);
      setShowCancelRequest(false);
    } catch (error) {
      Alert.alert('Request not cancelled', error.message || 'Please try again.');
    } finally {
      setCancellingRequest(false);
    }
  };

  const confirmBlock = () => Alert.alert(
    `Block ${profile.name}?`,
    'Their posts and chats will be hidden. They will not be able to send you requests or messages.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block account', style: 'destructive', onPress: () => blockUser(userId) },
    ],
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Avatar uri={profile.avatar} size={112} style={styles.avatar} accessibilityLabel={`${profile.name}'s profile avatar`} />
      <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
      <Text style={[styles.role, { color: theme.secondaryText }]}>{profile.role || 'LST community member'}</Text>
      <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>

      <View style={[styles.stats, { borderColor: theme.border }]}>
        <View style={styles.stat}><Text style={[styles.statValue, { color: theme.text }]}>{postsCount}</Text><Text style={[styles.statLabel, { color: theme.secondaryText }]}>Posts</Text></View>
        <View style={[styles.stat, styles.middleStat, { borderColor: theme.border }]}><Text style={[styles.statValue, { color: theme.text }]}>{joinedCommunities.length}</Text><Text style={[styles.statLabel, { color: theme.secondaryText }]}>Circles</Text></View>
        <View style={styles.stat}><Text style={[styles.statValue, { color: theme.text }]}>{sharedCommunities}</Text><Text style={[styles.statLabel, { color: theme.secondaryText }]}>In common</Text></View>
      </View>

      {!isOwnProfile ? <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: relationship === 'outgoing' ? theme.primarySoft : theme.primary }]}
          onPress={primaryAction}
          disabled={relationship === 'outgoing'}
        >
          <AppIcon name={actionIcon} size={16} color={relationship === 'outgoing' ? theme.primary : '#FFFFFF'} />
          <Text style={[styles.primaryText, { color: relationship === 'outgoing' ? theme.primary : '#FFFFFF' }]}>{actionLabel}</Text>
        </TouchableOpacity>
        {relationship === 'incoming' || relationship === 'outgoing' ? (
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={relationship === 'outgoing' ? () => setShowCancelRequest(true) : () => declineFriendRequest(userId)}>
            <AppIcon name="times" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View> : null}

      {!isOwnProfile && relationship !== 'blocked' ? <View style={[styles.accountActions, { borderTopColor: theme.border }]}>
        {relationship === 'friends' ? (
          <TouchableOpacity style={styles.accountAction} onPress={confirmUnfriend}>
            <AppIcon name="user-minus" size={15} color={theme.secondaryText} />
            <Text style={[styles.accountActionText, { color: theme.secondaryText }]}>Unfriend</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.accountAction} onPress={confirmBlock}>
          <AppIcon name="ban" size={15} color={theme.danger} />
          <Text style={[styles.accountActionText, { color: theme.danger }]}>Block account</Text>
        </TouchableOpacity>
      </View> : null}

      {!isOwnProfile && relationship !== 'blocked' ? <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
        <AppIcon name="shield-alt" size={17} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.primary }]}>
          Messaging becomes available only after a friend request is accepted.
        </Text>
      </View> : null}
      <ConfirmModal
        visible={showCancelRequest}
        title={`Cancel request to ${profile.name}?`}
        message="They will no longer see this friend request. You can send another one later."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        icon="user-minus"
        loading={cancellingRequest}
        onCancel={() => setShowCancelRequest(false)}
        onConfirm={confirmCancelRequest}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', padding: 24, paddingTop: 34 },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  name: { fontSize: 25, fontWeight: '700', marginTop: 15 },
  role: { fontSize: 13, marginTop: 4 },
  bio: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 16, paddingHorizontal: 14 },
  stats: { width: '100%', flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginTop: 24, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  middleStat: { borderLeftWidth: 1, borderRightWidth: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 3 },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryButton: { flex: 1, height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 14, fontWeight: '700' },
  secondaryButton: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { width: '100%', flexDirection: 'row', gap: 10, padding: 14, borderRadius: 15, marginTop: 18 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  accountActions: { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 26, borderTopWidth: 1, paddingTop: 18, marginTop: 22 },
  accountAction: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 6 },
  accountActionText: { fontSize: 12, fontWeight: '700' },
});
