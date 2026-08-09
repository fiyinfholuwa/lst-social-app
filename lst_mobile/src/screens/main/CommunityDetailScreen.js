import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';
import ConfirmModal from '../../components/ConfirmModal';
import PostCard from '../../components/PostCard';
import { useAuth } from '../../context/AuthContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';
import { useCommunityApplications } from '../../context/CommunityApplicationsContext';
import { useSavedPosts } from '../../context/SavedPostsContext';

export default function CommunityDetailScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [checkingApplicationAccess, setCheckingApplicationAccess] = useState(false);
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const friendshipState = useFriendships();
  const blockedUserIds = Array.isArray(friendshipState?.blockedUserIds) ? friendshipState.blockedUserIds : [];
  const { getApplication, withdrawApplication, refreshApplications } = useCommunityApplications();
  const application = getApplication(communityId);
  const joined = Array.isArray(user?.joinedCommunities) && user.joinedCommunities.map(String).includes(String(communityId));
  const pendingApplication = application?.status === 'pending';
  const { isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();

  const loadCommunity = async () => {
    const requests = [apiService.getCommunity(communityId)];
    if (joined) {
      requests.push(apiService.getCommunityMembers(communityId));
      requests.push(apiService.getCommunityPosts(communityId, 1));
    }
    const [communityResult, membersResult, postsResult] = await Promise.allSettled(requests);
    if (communityResult.status === 'rejected') throw communityResult.reason;
    setCommunity(communityResult.value);
    setMembers(joined && membersResult?.status === 'fulfilled' ? membersResult.value : []);
    if (joined && postsResult?.status === 'fulfilled') {
      setPosts(postsResult.value.data);
      setPostPage(postsResult.value.currentPage);
      setHasMorePosts(postsResult.value.hasMorePages);
    } else if (!joined) {
      setPosts([]);
      setPostPage(1);
      setHasMorePosts(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || loadingMorePosts) return;
    setLoadingMorePosts(true);
    try {
      const response = await apiService.getCommunityPosts(communityId, postPage + 1);
      setPosts(current => [...current, ...response.data]);
      setPostPage(response.currentPage);
      setHasMorePosts(response.hasMorePages);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const deletePost = async post => {
    try {
      await apiService.deletePost(post.id);
      forgetDeletedPost(post.id);
      setPosts(current => current.filter(item => item.id !== post.id));
    } catch (error) {
      Alert.alert('Couldn’t delete post', error.message);
    }
  };

  const openApplication = async () => {
    if (checkingApplicationAccess) return;
    setCheckingApplicationAccess(true);
    try {
      const latestUser = await refreshUser();
      if (!latestUser?.emailVerified) {
        Alert.alert('Verify your email', 'You need to verify your email before viewing or filling a community application.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Verify email', onPress: () => navigation.navigate('Profile') },
        ]);
        return;
      }
      navigation.navigate('CommunityApplication', { communityId });
    } catch (error) {
      Alert.alert('Verify your email', 'Verify your email before applying to join a community.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Verify email', onPress: () => navigation.navigate('Profile') },
      ]);
    } finally {
      setCheckingApplicationAccess(false);
    }
  };

  const leaveCommunity = async () => {
    setLeaving(true);
    try {
      await apiService.leaveCommunity(communityId);
      await refreshUser();
      setMembers(current => current.filter(member => String(member.id) !== String(user.id)));
      setCommunity(current => ({ ...current, memberCount: Math.max(0, current.memberCount - 1) }));
      setPosts([]);
      setHasMorePosts(false);
      setLeaveVisible(false);
    } finally {
      setLeaving(false);
    }
  };

  useFocusEffect(React.useCallback(() => {
    refreshUser().catch(() => {});
    refreshApplications().catch(() => {});
    loadCommunity().catch(() => {});
  }, [communityId, joined, refreshApplications, refreshUser]));

  if (!community) return <Loader />;

  const visibleMembers = members.filter(member => !blockedUserIds.includes(member.id));

  const Header = () => (
    <>
      <Image source={{ uri: community.image }} style={styles.cover} />
      <View style={styles.intro}>
        <Text style={[styles.title, { color: theme.text }]}>{community.name}</Text>
        <Text style={[styles.description, { color: theme.secondaryText }]}>{community.description}</Text>

        <View style={styles.overview}>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: theme.text }]}>{community.memberCount}</Text>
            <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Members</Text>
          </View>
          <View style={[styles.overviewItem, styles.overviewMiddle, { borderColor: theme.border }]}>
            <Text style={[styles.overviewValue, { color: theme.text }]}>{community.postCount}</Text>
            <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Posts</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: theme.text }]} numberOfLines={1}>{community.admin.split(' ')[0]}</Text>
            <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Admin</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: joined || pendingApplication ? theme.primarySoft : theme.primary }]}
          onPress={openApplication}
          disabled={joined || pendingApplication || checkingApplicationAccess}
        >
          {checkingApplicationAccess ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppIcon name={joined ? 'check' : pendingApplication ? 'clock' : user?.emailVerified ? 'file-alt' : 'lock'} size={14} color={joined || pendingApplication ? theme.primary : '#FFFFFF'} />}
          <Text style={[styles.joinText, { color: joined || pendingApplication ? theme.primary : '#FFFFFF' }]}>
            {joined ? 'You are a member' : pendingApplication ? 'Application under review' : checkingApplicationAccess ? 'Checking access…' : user?.emailVerified ? 'View requirements & apply' : 'Verify email to apply'}
          </Text>
        </TouchableOpacity>

        {community.canModerate ? <TouchableOpacity style={[styles.moderationButton, { backgroundColor: theme.card, borderColor: theme.primary }]} onPress={() => navigation.navigate('CommunityModeration', { communityId, communityName: community.name })}><View style={[styles.moderationIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="shield-checkmark-outline" size={17} color={theme.primary} /></View><View style={styles.moderationCopy}><Text style={[styles.moderationTitle, { color: theme.text }]}>Review pending requests</Text><Text style={[styles.moderationText, { color: theme.secondaryText }]}>Membership applications and community posts</Text></View><AppIcon name="chevron-right" size={15} color={theme.primary} /></TouchableOpacity> : null}

        {joined ? (
          <View style={styles.memberActions}>
            <TouchableOpacity style={[styles.postButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('CreatePost', { communityId, communityName: community.name })}>
              <AppIcon name="create-outline" size={14} color="#FFFFFF" />
              <Text style={styles.postButtonText}>Create post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.leaveButton, { borderColor: theme.danger }]} onPress={() => setLeaveVisible(true)}>
              <Text style={[styles.leaveButtonText, { color: theme.danger }]}>Leave community</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {pendingApplication ? (
          <View style={styles.applicationMeta}>
            <Text style={[styles.applicationDate, { color: theme.secondaryText }]}>
              Submitted {new Date(application.submittedAt).toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={() => withdrawApplication(communityId)}>
              <Text style={[styles.withdrawText, { color: theme.danger }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.rules, { backgroundColor: theme.primarySoft }]}>
          <AppIcon name="shield-alt" size={16} color={theme.primary} />
          <View style={styles.rulesCopy}>
            <Text style={[styles.rulesTitle, { color: theme.primary }]}>Community guideline</Text>
            <Text style={[styles.rulesText, { color: theme.primary }]}>{community.rules}</Text>
          </View>
        </View>
      </View>

      {joined ? <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>People</Text>
            <Text style={[styles.sectionMeta, { color: theme.secondaryText }]}>Connect after becoming friends</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CommunityMembers', { communityId, communityName: community.name })}>
            <View style={styles.seeAllMembers}>
              <Text style={[styles.sectionLink, { color: theme.primary }]}>See all members</Text>
              <AppIcon name="chevron-right" size={12} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.members}>
          {visibleMembers.map(member => (
            <TouchableOpacity key={member.id} style={styles.member} onPress={() => navigation.navigate('UserProfile', { userId: member.id })}>
              <Avatar uri={member.avatar} size={52} style={styles.memberAvatar} accessibilityLabel={`${member.name}'s profile avatar`} />
              <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> : null}

      {joined ? <View style={[styles.sectionHeading, styles.postsHeading]}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest posts</Text>
          <Text style={[styles.sectionMeta, { color: theme.secondaryText }]}>Updates from this community</Text>
        </View>
      </View> : <View style={[styles.lockedPosts, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.lockedIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="lock" size={20} color={theme.primary} /></View>
        <View style={styles.lockedCopy}><Text style={[styles.lockedTitle, { color: theme.text }]}>Member posts are private</Text><Text style={[styles.lockedText, { color: theme.secondaryText }]}>Join this community to view posts shared by its members.</Text></View>
      </View>}
    </>
  );

  return (
    <>
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={posts}
      keyExtractor={item => item.id}
      ListHeaderComponent={<Header />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onEndReached={loadMorePosts}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMorePosts ? <ActivityIndicator style={styles.postsLoader} color={theme.primary} /> : null}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
          onLike={() => apiService.likePost(item.id).then(loadCommunity).catch(error => Alert.alert('Couldn’t update post', error.message))}
          onSave={() => toggleSavedPost(item.id)}
          onEdit={String(item.userId) === String(user?.id) ? () => navigation.navigate('EditPost', { postId: item.id }) : undefined}
          onDelete={String(item.userId) === String(user?.id) ? () => deletePost(item) : undefined}
          isSaved={isPostSaved(item.id)}
        />
      )}
      ListEmptyComponent={joined ? (
        <View style={styles.empty}>
          <AppIcon name="comments" size={26} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Community updates will appear here.</Text>
        </View>
      ) : null}
    />
    <ConfirmModal
      visible={leaveVisible}
      title="Leave this community?"
      message="You will lose member access. You can apply again later if you want to return."
      confirmLabel="Leave community"
      icon="sign-out-alt"
      loading={leaving}
      onCancel={() => setLeaveVisible(false)}
      onConfirm={leaveCommunity}
    />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  cover: { width: '100%', height: 210, resizeMode: 'cover' },
  intro: { padding: 18 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  description: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  overview: { flexDirection: 'row', marginTop: 20 },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewMiddle: { borderLeftWidth: 1, borderRightWidth: 1 },
  overviewValue: { fontSize: 15, fontWeight: '700', maxWidth: 80 },
  overviewLabel: { fontSize: 11, marginTop: 3 },
  joinButton: { height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  joinText: { fontSize: 14, fontWeight: '700' },
  moderationButton: { minHeight: 66, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  moderationIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moderationCopy: { flex: 1 }, moderationTitle: { fontSize: 12.5, fontWeight: '800' }, moderationText: { fontSize: 10.5, marginTop: 3 },
  memberActions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  postButton: { flex: 1, minHeight: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  postButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  leaveButton: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  leaveButtonText: { fontSize: 12, fontWeight: '800' },
  applicationMeta: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 9 },
  applicationDate: { fontSize: 11 },
  withdrawText: { fontSize: 11, fontWeight: '700' },
  rules: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 15, marginTop: 14 },
  rulesCopy: { flex: 1 },
  rulesTitle: { fontSize: 11, fontWeight: '700' },
  rulesText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  section: { paddingTop: 8 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 18, marginBottom: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionMeta: { fontSize: 11, marginTop: 3 },
  sectionLink: { fontSize: 11, fontWeight: '700' },
  seeAllMembers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  members: { paddingHorizontal: 18, gap: 14 },
  member: { width: 58, alignItems: 'center' },
  memberAvatar: { width: 52, height: 52, borderRadius: 26 },
  memberName: { fontSize: 11, fontWeight: '600', marginTop: 6, maxWidth: 58 },
  postsHeading: { marginTop: 28 },
  lockedPosts: { marginHorizontal: 18, marginTop: 28, borderWidth: 1, borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  lockedIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lockedCopy: { flex: 1 },
  lockedTitle: { fontSize: 13, fontWeight: '800' },
  lockedText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  post: { marginHorizontal: 18, marginBottom: 10, padding: 14, borderWidth: 1, borderRadius: 17 },
  postTop: { flexDirection: 'row', alignItems: 'center' },
  postAuthorLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pendingBadge: { fontSize: 9, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  postAvatar: { width: 34, height: 34, borderRadius: 10, marginRight: 9 },
  postAuthor: { fontSize: 12, fontWeight: '700' },
  postTime: { fontSize: 11, marginTop: 2 },
  postContent: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  postActions: { flexDirection: 'row', gap: 24, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 11, marginTop: 4 },
  postsLoader: { paddingVertical: 20 },
});
