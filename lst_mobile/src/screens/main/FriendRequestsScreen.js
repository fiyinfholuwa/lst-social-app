import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function FriendRequestsScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { acceptFriendRequest, declineFriendRequest, friendshipsLoading, refreshFriendships } = useFriendships();
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadPeople = React.useCallback(async (requestedPage = 1) => {
    if (requestedPage === 1) setLoading(true); else setLoadingMore(true);
    setLoadError('');
    try {
      const response = await apiService.getFriendRequestsPage('incoming', requestedPage);
      setPeople(current => requestedPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.currentPage);
      setHasMore(Boolean(response.hasMorePages));
    } catch (error) {
      setLoadError(error.message || 'Unable to load friend requests.');
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => {
    refreshFriendships({ silent: true });
    loadPeople(1);
  }, [loadPeople, refreshFriendships]));

  if (friendshipsLoading || loading) return <Loader />;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + 28 }, people.length === 0 && styles.emptyContent]}
      data={people}
      keyExtractor={item => item.id}
      onEndReached={() => hasMore && !loadingMore && loadPeople(page + 1)}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.request, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
          <Avatar uri={item.avatar} size={58} style={styles.avatar} accessibilityLabel={`${item.name}'s profile avatar`} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.bio, { color: theme.secondaryText }]} numberOfLines={1}>{item.bio}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.accept, { backgroundColor: theme.primary }]} onPress={() => acceptFriendRequest(item.id).then(() => setPeople(current => current.filter(person => person.id !== item.id)))}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.decline, { borderColor: theme.border }]} onPress={() => declineFriendRequest(item.id).then(() => setPeople(current => current.filter(person => person.id !== item.id)))}>
                <Text style={[styles.declineText, { color: theme.text }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppIcon name="user-check" size={30} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{loadError ? 'Couldn’t load requests' : 'No pending requests'}</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{loadError || 'New friend requests will appear here.'}</Text>
          {loadError ? <TouchableOpacity style={[styles.retry, { backgroundColor: theme.primary }]} onPress={() => loadPeople(1)}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 14 },
  emptyContent: { flexGrow: 1 },
  request: { flexDirection: 'row', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 58, height: 58, borderRadius: 29, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  bio: { fontSize: 12, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  accept: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  acceptText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  decline: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
  declineText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, marginTop: 5 },
  footer: { paddingVertical: 18 },
  retry: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});
