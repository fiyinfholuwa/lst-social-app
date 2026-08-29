import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function BlockedAccountsScreen({ navigation }) {
  const { theme } = useTheme();
  const { unblockUser } = useFriendships();
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadPeople = async (requestedPage = 1) => {
    if (requestedPage === 1) setLoading(true); else setLoadingMore(true);
    setLoadError('');
    try {
      const response = await apiService.getBlockedUsersPage(requestedPage);
      setPeople(current => requestedPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.currentPage); setHasMore(Boolean(response.hasMorePages));
    } catch (error) {
      setLoadError(error.message || 'Unable to load blocked accounts.');
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  };

  useEffect(() => { loadPeople(1); }, []);

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, people.length === 0 && styles.emptyContent]}
      data={people}
      onEndReached={() => hasMore && !loadingMore && loadPeople(page + 1)}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Avatar uri={item.avatar} size={48} style={styles.avatar} accessibilityLabel={`${item.name}'s profile avatar`} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.status, { color: theme.secondaryText }]}>Blocked account</Text>
          </View>
          <TouchableOpacity style={[styles.unblock, { borderColor: theme.border }]} onPress={() => unblockUser(item.id).then(() => setPeople(current => current.filter(person => person.id !== item.id)))}>
            <Text style={[styles.unblockText, { color: theme.primary }]}>Unblock</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <TouchableOpacity style={[styles.friendsLink, { backgroundColor: theme.primarySoft }]} onPress={() => navigation.navigate('MainTabs', { screen: 'Friends' })}>
          <AppIcon name="users" size={15} color={theme.primary} />
          <Text style={[styles.friendsText, { color: theme.primary }]}>View all friends</Text>
          <AppIcon name="chevron-right" size={13} color={theme.primary} />
        </TouchableOpacity>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppIcon name="shield-alt" size={30} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{loadError ? 'Couldn’t load accounts' : loading ? 'Loading…' : 'No blocked accounts'}</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{loadError || 'Accounts you block will be listed here.'}</Text>
          {loadError ? <TouchableOpacity style={[styles.retry, { backgroundColor: theme.primary }]} onPress={() => loadPeople(1)}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  emptyContent: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 13, borderWidth: 1, borderRadius: 16, marginBottom: 10 },
  friendsLink: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 14, marginBottom: 14 },
  friendsText: { flex: 1, fontSize: 13, fontWeight: '700' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  status: { fontSize: 11, marginTop: 3 },
  unblock: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderRadius: 10 },
  unblockText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, marginTop: 5 },
  footer: { paddingVertical: 18 },
  retry: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});
