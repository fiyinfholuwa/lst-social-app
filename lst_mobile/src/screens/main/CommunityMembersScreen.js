import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function CommunityMembersScreen({ route, navigation }) {
  const { communityId, communityName } = route.params;
  const { theme } = useTheme();
  const { getRelationship, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, refreshFriendships } = useFriendships();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadMembers = async (requestedPage = 1, search = query) => {
    if (requestedPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const response = await apiService.getCommunityMemberDirectory(communityId, search.trim(), requestedPage);
      setMembers(current => requestedPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.currentPage);
      setHasMore(response.hasMorePages);
      setTotal(response.total);
    } catch (error) {
      if (requestedPage === 1) setMembers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(React.useCallback(() => { refreshFriendships(); }, [refreshFriendships]));

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(1, query), 300);
    return () => clearTimeout(timer);
  }, [communityId, query]);

  const updateRequest = async (member, relationship) => {
    setWorkingId(String(member.id));
    try {
      if (relationship === 'incoming') await acceptFriendRequest(member.id);
      else await sendFriendRequest(member.id);
    } catch (error) {
      Alert.alert('Request not updated', error.message || 'Please try again.');
    } finally {
      setWorkingId(null);
    }
  };

  const cancelRequest = async () => {
    if (!cancelTarget) return;
    setWorkingId(String(cancelTarget.id));
    try {
      await cancelFriendRequest(cancelTarget.id);
      setCancelTarget(null);
    } catch (error) {
      Alert.alert('Request not cancelled', error.message || 'Please try again.');
    } finally {
      setWorkingId(null);
    }
  };

  const renderMember = ({ item }) => {
    const relationship = getRelationship(item.id);
    const pending = workingId === String(item.id);
    const outgoing = relationship === 'outgoing';
    const friend = relationship === 'friends';
    const incoming = relationship === 'incoming';

    return (
      <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.profile} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
          <Avatar uri={item.avatar} size={48} style={styles.avatar} accessibilityLabel={`${item.name}'s profile avatar`} />
          <View style={styles.copy}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.bio, { color: theme.secondaryText }]} numberOfLines={1}>{item.bio || 'Community member'}</Text>
          </View>
        </TouchableOpacity>
        {friend ? <View style={[styles.status, { backgroundColor: theme.primarySoft }]}><Text style={[styles.statusText, { color: theme.primary }]}>Friends</Text></View> : relationship === 'blocked' ? null : (
          <TouchableOpacity
            style={[styles.action, { backgroundColor: outgoing ? theme.primarySoft : theme.primary }]}
            onPress={outgoing ? () => setCancelTarget(item) : () => updateRequest(item, relationship)}
            disabled={workingId !== null}
          >
            {pending ? <ActivityIndicator size="small" color={outgoing ? theme.primary : '#FFFFFF'} /> : <AppIcon name={outgoing ? 'times' : incoming ? 'user-check' : 'user-plus'} size={14} color={outgoing ? theme.primary : '#FFFFFF'} />}
            <Text style={[styles.actionText, { color: outgoing ? theme.primary : '#FFFFFF' }]}>{outgoing ? 'Cancel' : incoming ? 'Accept' : 'Add'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.text }]}>{communityName}</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{loading ? 'Loading members…' : `${total} people`}</Text>
      </View>
      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AppIcon name="search" size={17} color={theme.secondaryText} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search members by name" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} autoCapitalize="words" />
        {query ? <TouchableOpacity onPress={() => setQuery('')}><AppIcon name="times-circle" size={17} color={theme.secondaryText} /></TouchableOpacity> : null}
      </View>
      <FlatList
        data={members}
        keyExtractor={item => String(item.id)}
        renderItem={renderMember}
        contentContainerStyle={[styles.list, !members.length && styles.emptyList]}
        onEndReached={() => hasMore && !loadingMore && loadMembers(page + 1)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
        ListEmptyComponent={!loading ? <View style={styles.empty}><AppIcon name="users" size={30} color={theme.secondaryText} /><Text style={[styles.emptyTitle, { color: theme.text }]}>No members found</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Try a different name.</Text></View> : <ActivityIndicator color={theme.primary} />}
      />
      <ConfirmModal visible={Boolean(cancelTarget)} title={`Cancel request to ${cancelTarget?.name || 'this person'}?`} message="You can send another friend request later." confirmLabel="Cancel request" cancelLabel="Keep request" icon="user-minus" loading={Boolean(cancelTarget) && workingId === String(cancelTarget?.id)} onCancel={() => setCancelTarget(null)} onConfirm={cancelRequest} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { paddingHorizontal: 16, paddingTop: 18 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4 },
  search: { height: 48, margin: 16, marginBottom: 7, paddingHorizontal: 13, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  input: { flex: 1, fontSize: 14 },
  list: { padding: 16, paddingTop: 7, paddingBottom: 40 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  row: { minHeight: 72, marginBottom: 9, padding: 11, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8 },
  profile: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: 10 },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  bio: { fontSize: 11, marginTop: 3 },
  action: { minWidth: 76, height: 38, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionText: { fontSize: 11, fontWeight: '800' },
  status: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11 },
  statusText: { fontSize: 11, fontWeight: '800' },
  footer: { paddingVertical: 18 },
  empty: { alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 12, marginTop: 4 },
});
