import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';
import { useCommunityApplications } from '../../context/CommunityApplicationsContext';

export default function CommunityDetailScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const { theme } = useTheme();
  const { user } = useAuth();
  const friendshipState = useFriendships();
  const blockedUserIds = Array.isArray(friendshipState?.blockedUserIds) ? friendshipState.blockedUserIds : [];
  const [joined, setJoined] = useState(user.joinedCommunities?.includes(communityId));
  const { getApplication, withdrawApplication } = useCommunityApplications();
  const application = getApplication(communityId);

  useEffect(() => {
    Promise.all([
      apiService.getCommunity(communityId),
      apiService.getCommunityMembers(communityId),
    ]).then(([communityData, memberData]) => {
      setCommunity(communityData);
      setMembers(memberData);
    });
  }, [communityId]);

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
            <Text style={[styles.overviewValue, { color: theme.text }]}>{community.posts.length}</Text>
            <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Posts</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: theme.text }]} numberOfLines={1}>{community.admin.split(' ')[0]}</Text>
            <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Admin</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: joined || application ? theme.primarySoft : theme.primary }]}
          onPress={() => navigation.navigate('CommunityApplication', { communityId })}
          disabled={joined || Boolean(application)}
        >
          <AppIcon name={joined ? 'check' : application ? 'clock' : 'file-alt'} size={14} color={joined || application ? theme.primary : '#FFFFFF'} />
          <Text style={[styles.joinText, { color: joined || application ? theme.primary : '#FFFFFF' }]}>
            {joined ? 'You are a member' : application ? 'Application under review' : 'View requirements & apply'}
          </Text>
        </TouchableOpacity>

        {application ? (
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

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>People</Text>
            <Text style={[styles.sectionMeta, { color: theme.secondaryText }]}>Connect after becoming friends</Text>
          </View>
          <Text style={[styles.sectionLink, { color: theme.primary }]}>{community.memberCount} members</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.members}>
          {visibleMembers.map(member => (
            <TouchableOpacity key={member.id} style={styles.member} onPress={() => navigation.navigate('UserProfile', { userId: member.id })}>
              <Avatar uri={member.avatar} size={52} style={styles.memberAvatar} accessibilityLabel={`${member.name}'s profile avatar`} />
              <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.sectionHeading, styles.postsHeading]}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest posts</Text>
          <Text style={[styles.sectionMeta, { color: theme.secondaryText }]}>Updates from this community</Text>
        </View>
      </View>
    </>
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={community.posts}
      keyExtractor={item => item.id}
      ListHeaderComponent={<Header />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={[styles.post, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.postTop}>
            <Image source={{ uri: community.image }} style={styles.postAvatar} />
            <View>
              <Text style={[styles.postAuthor, { color: theme.text }]}>{community.name}</Text>
              <Text style={[styles.postTime, { color: theme.secondaryText }]}>{item.timestamp}</Text>
            </View>
          </View>
          <Text style={[styles.postContent, { color: theme.text }]}>{item.content}</Text>
          <View style={[styles.postActions, { borderTopColor: theme.border }]}>
            <AppIcon name="heart" size={15} color={theme.secondaryText} />
            <AppIcon name="comment" size={15} color={theme.secondaryText} />
            <AppIcon name="bookmark" size={15} color={theme.secondaryText} />
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppIcon name="comments" size={26} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Community updates will appear here.</Text>
        </View>
      }
    />
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
  members: { paddingHorizontal: 18, gap: 14 },
  member: { width: 58, alignItems: 'center' },
  memberAvatar: { width: 52, height: 52, borderRadius: 26 },
  memberName: { fontSize: 11, fontWeight: '600', marginTop: 6, maxWidth: 58 },
  postsHeading: { marginTop: 28 },
  post: { marginHorizontal: 18, marginBottom: 10, padding: 14, borderWidth: 1, borderRadius: 17 },
  postTop: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 34, height: 34, borderRadius: 10, marginRight: 9 },
  postAuthor: { fontSize: 12, fontWeight: '700' },
  postTime: { fontSize: 11, marginTop: 2 },
  postContent: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  postActions: { flexDirection: 'row', gap: 24, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 11, marginTop: 4 },
});
