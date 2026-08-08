import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import Loader from '../../components/Loader';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function FriendsScreen({ navigation }) {
  const { theme } = useTheme();
  const { friendIds, outgoingRequestIds, blockedUserIds, blockUser, friendshipsLoading, refreshFriendships, getRelationship, sendFriendRequest, cancelFriendRequest, acceptFriendRequest } = useFriendships();
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const searchInput = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      refreshFriendships();
    }, [refreshFriendships]),
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      Promise.allSettled(friendIds.map(id => apiService.getUser(id))),
      Promise.allSettled(outgoingRequestIds.map(id => apiService.getUser(id))),
    ]).then(([friendResults, requestResults]) => {
      if (!active) return;
      setFriends(friendResults.filter(result => result.status === 'fulfilled').map(result => result.value).filter(Boolean));
      setSentRequests(requestResults.filter(result => result.status === 'fulfilled').map(result => result.value).filter(Boolean));
    });

    return () => { active = false; };
  }, [friendIds, outgoingRequestIds]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      apiService.searchUsers(term)
        .then(people => { if (active) setResults(people); })
        .catch(() => { if (active) setResults([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const addFriend = async (person, relationship) => {
    const personId = String(person.id);
    if (sendingId !== null) return;
    setSendingId(personId);
    try {
      if (relationship === 'incoming') await acceptFriendRequest(personId);
      else await sendFriendRequest(personId);
    } catch (error) {
      Alert.alert('Request not sent', error.message || 'Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const cancelRequest = async () => {
    if (!cancelTarget || sendingId !== null) return;
    const personId = String(cancelTarget.id);
    setSendingId(personId);
    try {
      await cancelFriendRequest(personId);
      setCancelTarget(null);
    } catch (error) {
      Alert.alert('Request not cancelled', error.message || 'Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const openChat = async friend => {
    const chat = await apiService.getOrCreateChat(friend);
    navigation.navigate('ChatDetail', { chatId: chat.id, userName: friend.name });
  };

  const confirmBlock = friend => Alert.alert(
    `Block ${friend.name}?`,
    'This will remove the friendship and hide their posts and messages.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => blockUser(friend.id) },
    ],
  );

  if (friendshipsLoading) return <Loader />;

  const isSearching = query.trim().length >= 2;
  const displayedPeople = isSearching ? results : [
    ...(sentRequests.length ? [{ id: 'sent-requests-heading', rowType: 'heading', title: 'Sent requests' }, ...sentRequests] : []),
    ...(friends.length ? [{ id: 'friends-heading', rowType: 'heading', title: 'Friends' }, ...friends] : []),
  ];

  const renderPerson = ({ item }) => {
    if (item.rowType === 'heading') {
      return <Text style={[styles.sectionHeading, { color: theme.secondaryText }]}>{item.title}</Text>;
    }

    const relationship = getRelationship(item.id);
    const itemId = String(item.id);
    const isFriend = relationship === 'friends';
    const requestSent = relationship === 'outgoing';
    const requestReceived = relationship === 'incoming';

    return (
      <View style={[styles.friendRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.profileArea} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
          <Avatar uri={item.avatar} size={48} style={styles.avatar} accessibilityLabel={`${item.name}'s profile avatar`} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.bio, { color: theme.secondaryText }]} numberOfLines={1}>{item.bio || 'LST community member'}</Text>
          </View>
        </TouchableOpacity>
        {!isFriend && (isSearching || requestSent) ? (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: requestSent ? theme.primarySoft : theme.primary }]}
            onPress={requestSent ? () => setCancelTarget(item) : () => addFriend(item, relationship)}
            disabled={sendingId !== null}
            accessibilityLabel={requestSent ? `Cancel friend request to ${item.name}` : `Add ${item.name} as a friend`}
          >
            {sendingId === itemId
              ? <ActivityIndicator size="small" color={requestSent ? theme.primary : '#FFFFFF'} />
              : <AppIcon name={requestSent ? 'times' : 'user-plus'} size={15} color={requestSent ? theme.primary : '#FFFFFF'} />}
            <Text style={[styles.requestText, { color: requestSent ? theme.primary : '#FFFFFF' }]}>{requestSent ? 'Cancel' : requestReceived ? 'Accept' : 'Add'}</Text>
          </TouchableOpacity>
        ) : isFriend ? (
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.primarySoft }]} onPress={() => openChat(item)} accessibilityLabel={`Message ${item.name}`}>
            <AppIcon name="comment" size={15} color={theme.primary} />
          </TouchableOpacity>
        ) : null}
        {!isSearching && isFriend ? (
          <TouchableOpacity style={styles.iconButton} onPress={() => confirmBlock(item)} accessibilityLabel={`Block ${item.name}`}>
            <AppIcon name="ban" size={15} color={theme.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={[styles.blockedLink, { backgroundColor: theme.primarySoft }]} onPress={() => navigation.navigate('BlockedAccounts')}>
        <AppIcon name="ban" size={15} color={theme.primary} />
        <Text style={[styles.blockedText, { color: theme.primary }]}>Blocked accounts</Text>
        <Text style={[styles.blockedCount, { color: theme.primary }]}>{blockedUserIds.length}</Text>
        <AppIcon name="chevron-right" size={13} color={theme.primary} />
      </TouchableOpacity>

      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AppIcon name="search" size={18} color={theme.secondaryText} />
        <TextInput
          ref={searchInput}
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a friend by name"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {searching ? <ActivityIndicator size="small" color={theme.primary} /> : null}
        {query.length > 0 && !searching ? (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <AppIcon name="times-circle" size={18} color={theme.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={displayedPeople}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.content, displayedPeople.length === 0 && styles.emptyContent]}
        renderItem={renderPerson}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name={isSearching ? 'search' : 'users'} size={31} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{isSearching ? 'No people found' : 'No friends yet'}</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              {isSearching ? 'Try another name.' : 'Search for someone you know and send them a friend request.'}
            </Text>
            {!isSearching ? (
              <TouchableOpacity style={[styles.findButton, { backgroundColor: theme.primary }]} onPress={() => searchInput.current?.focus()}>
                <AppIcon name="search" size={16} color="#FFFFFF" />
                <Text style={styles.findButtonText}>Find friends</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
      <ConfirmModal
        visible={Boolean(cancelTarget)}
        title={`Cancel request to ${cancelTarget?.name || 'this person'}?`}
        message="They will no longer see this friend request. You can send another one later."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        icon="user-minus"
        loading={Boolean(cancelTarget) && sendingId === String(cancelTarget?.id)}
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blockedLink: { margin: 14, marginBottom: 4, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  blockedText: { flex: 1, fontSize: 13, fontWeight: '700' },
  blockedCount: { fontSize: 12, fontWeight: '700' },
  searchBox: { minHeight: 48, marginHorizontal: 14, marginTop: 10, paddingHorizontal: 13, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
  content: { padding: 14 },
  sectionHeading: { marginTop: 5, marginBottom: 9, paddingHorizontal: 3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  emptyContent: { flexGrow: 1 },
  friendRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 17, marginBottom: 10, gap: 7 },
  profileArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  bio: { fontSize: 11, marginTop: 3 },
  iconButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  requestButton: { minWidth: 67, height: 38, paddingHorizontal: 11, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  requestText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5, paddingHorizontal: 24, textAlign: 'center' },
  findButton: { height: 42, marginTop: 18, paddingHorizontal: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  findButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
