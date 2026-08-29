import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Loader';
import PostCard from '../../components/PostCard';
import ReportModal from '../../components/ReportModal';
import { useAuth } from '../../context/AuthContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useTheme } from '../../context/ThemeContext';

const displayBirthday = value => {
  const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return new Date(2000, Number(match[1]) - 1, Number(match[2])).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
};

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [reportingUser, setReportingUser] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadError, setLoadError] = useState('');
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
    let active = true;
    setLoadError('');
    Promise.all([apiService.getUser(userId), apiService.getUserPosts(userId, 1)])
      .then(([person, postPage]) => {
        if (!active) return;
        setProfile(person);
        setPosts(postPage.data);
        setPostsPage(postPage.currentPage);
        setHasMorePosts(Boolean(postPage.hasMorePages));
      })
      .catch(error => active && setLoadError(error.message || 'This profile could not be loaded.'));
    return () => { active = false; };
  }, [userId]);

  if (!profile && !loadError) return <Loader />;
  if (!profile) return <View style={[styles.loadError, { backgroundColor: theme.background }]}><AppIcon name="warning-outline" size={28} color={theme.danger} /><Text style={[styles.loadErrorText, { color: theme.text }]}>{loadError}</Text></View>;

  const relationship = getRelationship(userId);
  const isOwnProfile = String(userId) === String(user.id);
  const joinedCommunities = Array.isArray(profile.joinedCommunities) ? profile.joinedCommunities.map(String) : [];
  const ownCommunities = Array.isArray(user.joinedCommunities) ? user.joinedCommunities.map(String) : [];
  const sharedCommunities = joinedCommunities.filter(id => ownCommunities.includes(id)).length;

  const refreshPosts = async () => {
    const response = await apiService.getUserPosts(userId, 1);
    setPosts(response.data);
    setPostsPage(response.currentPage);
    setHasMorePosts(Boolean(response.hasMorePages));
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || loadingMorePosts) return;
    setLoadingMorePosts(true);
    try {
      const response = await apiService.getUserPosts(userId, postsPage + 1);
      setPosts(current => {
        const postsById = new Map(current.map(post => [String(post.id), post]));
        response.data.forEach(post => postsById.set(String(post.id), post));
        return Array.from(postsById.values());
      });
      setPostsPage(response.currentPage);
      setHasMorePosts(Boolean(response.hasMorePages));
    } catch (error) {
      Alert.alert('Couldn’t load more posts', error.message);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const sharePost = post => navigation.navigate('SharePost', { postId: post.id });

  const deletePost = async post => {
    try {
      await apiService.deletePost(post.id);
      forgetDeletedPost(post.id);
      setPosts(current => current.filter(item => item.id !== post.id));
    } catch (error) {
      Alert.alert('Couldn’t delete post', error.message);
    }
  };

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
    'Their posts and chats will be hidden from you, and your friendship will be removed. This does not affect their relationship with other members.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block account', style: 'destructive', onPress: () => blockUser(userId) },
    ],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      scrollEventThrottle={250}
      onScroll={({ nativeEvent }) => {
        const distanceFromBottom = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
        if (distanceFromBottom < 350) loadMorePosts();
      }}
    >
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={[styles.heroAccent, { backgroundColor: theme.primary }]}>
          <View style={[styles.heroGlow, { backgroundColor: theme.accent }]} />
        </View>
        <View style={styles.avatarFrame}>
          <Avatar uri={profile.avatar} size={104} style={[styles.avatar, { borderColor: theme.card }]} accessibilityLabel={`${profile.name}'s profile avatar`} />
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
          <View style={[styles.rolePill, { backgroundColor: theme.primarySoft }]}> 
            <AppIcon name={profile.role === 'Community leader' ? 'shield-checkmark-outline' : 'person-outline'} size={13} color={theme.primary} />
            <Text style={[styles.role, { color: theme.primary }]}>{profile.role || 'LST community member'}</Text>
          </View>
          {profile.bio ? <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text> : null}
        </View>
      </View>

      {!profile.canSeePrivateDetails ? <View style={[styles.privateNotice, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}><View style={[styles.noticeIcon, { backgroundColor: theme.card }]}><AppIcon name="lock" size={15} color={theme.primary} /></View><View style={styles.privateCopy}><Text style={[styles.privateTitle, { color: theme.primary }]}>Private profile</Text><Text style={[styles.privateText, { color: theme.primary }]}>Personal information is hidden by this account’s privacy settings.</Text></View></View> : null}

      {profile.canSeePrivateDetails ? <View style={styles.detailsSection}>
        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>ABOUT</Text>
        <View style={[styles.personalDetails, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        {[['Phone number', profile.phoneNumber], ['Occupation', profile.occupation], ['Place of work', profile.workplace], ['Marital status', profile.maritalStatus?.replaceAll('_', ' ')], ['Birthday', displayBirthday(profile.dateOfBirth)], ['Hobbies', profile.hobbies]].filter(([, value]) => value).map(([label, value]) => <View key={label} style={styles.personalRow}><Text style={[styles.personalLabel, { color: theme.secondaryText }]}>{label}</Text><Text style={[styles.personalValue, { color: theme.text }]}>{value}</Text></View>)}
        </View>
      </View> : null}

      <View style={[styles.stats, { borderColor: theme.border }]}> 
        <View style={styles.stat}><Text style={[styles.statValue, { color: theme.text }]}>{joinedCommunities.length}</Text><Text style={[styles.statLabel, { color: theme.secondaryText }]}>Circles</Text></View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
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

      {!isOwnProfile ? <View style={[styles.accountActions, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.accountAction} onPress={() => setReportingUser(true)}>
          <AppIcon name="flag" size={15} color={theme.danger} />
          <Text style={[styles.accountActionText, { color: theme.danger }]}>Report</Text>
        </TouchableOpacity>
        {relationship === 'friends' ? <>
          <TouchableOpacity style={styles.accountAction} onPress={confirmUnfriend}>
            <AppIcon name="user-minus" size={15} color={theme.secondaryText} />
            <Text style={[styles.accountActionText, { color: theme.secondaryText }]}>Unfriend</Text>
          </TouchableOpacity>
        <TouchableOpacity style={styles.accountAction} onPress={confirmBlock}>
          <AppIcon name="ban" size={15} color={theme.danger} />
          <Text style={[styles.accountActionText, { color: theme.danger }]}>Block account</Text>
        </TouchableOpacity>
        </> : null}
      </View> : null}

      {!isOwnProfile && relationship !== 'blocked' ? <View style={[styles.notice, { backgroundColor: theme.primarySoft }]}>
        <AppIcon name="shield-alt" size={17} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.primary }]}>
          Messaging becomes available only after a friend request is accepted.
        </Text>
      </View> : null}

      <View style={styles.postsSection}>
        <View style={styles.postsHeading}>
          <Text style={[styles.postsTitle, { color: theme.text }]}>Posts</Text>
        </View>
        {posts.length ? posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            onOriginalPress={post.originalPost ? () => navigation.navigate('PostDetail', { postId: post.originalPost.id }) : undefined}
            onUserPress={() => {}}
            onLike={() => apiService.likePost(post.id).then(refreshPosts).catch(error => Alert.alert('Couldn’t update post', error.message))}
            onShare={() => sharePost(post)}
            onSave={() => toggleSavedPost(post.id)}
            onEdit={isOwnProfile ? () => navigation.navigate('EditPost', { postId: post.id }) : undefined}
            onDelete={isOwnProfile ? () => deletePost(post) : undefined}
            isSaved={isPostSaved(post.id)}
            containerStyle={styles.profilePost}
          />
        )) : (
          <View style={[styles.emptyPosts, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <AppIcon name="file-alt" size={25} color={theme.secondaryText} />
            <Text style={[styles.emptyPostsTitle, { color: theme.text }]}>No posts yet</Text>
            <Text style={[styles.emptyPostsText, { color: theme.secondaryText }]}>Posts shared by this account will appear here.</Text>
          </View>
        )}
        {loadingMorePosts ? <ActivityIndicator style={styles.postsFooter} color={theme.primary} /> : null}
      </View>
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
      <ReportModal visible={reportingUser} targetType="user" targetId={userId} targetName={profile.name} onClose={result => { setReportingUser(false); if (result?.submitted) Alert.alert('Report received', 'Thank you. The moderation team will review this account.'); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 44 },
  hero: { width: '100%', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  heroAccent: { height: 92, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -38, top: -72, opacity: 0.28 },
  avatarFrame: { alignItems: 'center', height: 48 },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 5, marginTop: -52 },
  identity: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 11, paddingBottom: 22 },
  name: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 7 },
  role: { fontSize: 11, fontWeight: '800' },
  bio: { fontSize: 13.5, lineHeight: 21, textAlign: 'center', marginTop: 14, paddingHorizontal: 6 },
  privateNotice: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, marginTop: 14 },
  noticeIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  privateCopy: { flex: 1 },
  privateTitle: { fontSize: 12, fontWeight: '800' },
  privateText: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  detailsSection: { width: '100%', marginTop: 22 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 4, marginBottom: 8 },
  personalDetails: { width: '100%', borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8 },
  personalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingVertical: 9 },
  personalLabel: { fontSize: 12 },
  personalValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  stats: { width: '100%', flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginTop: 24, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
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
  postsSection: { width: '100%', marginTop: 28 },
  postsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 3, marginBottom: 12 },
  postsTitle: { fontSize: 18, fontWeight: '800' },
  emptyPosts: { alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 26 },
  emptyPostsTitle: { fontSize: 14, fontWeight: '800', marginTop: 10 },
  emptyPostsText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  loadError: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  loadErrorText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  profilePost: { marginHorizontal: 0, width: '100%' },
  postsFooter: { paddingVertical: 18 },
});
