import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function FriendRequestsScreen({ navigation }) {
  const { theme } = useTheme();
  const { incomingRequestIds, acceptFriendRequest, declineFriendRequest, friendshipsLoading } = useFriendships();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    Promise.all(incomingRequestIds.map(id => apiService.getUser(id))).then(results => setPeople(results.filter(Boolean)));
  }, [incomingRequestIds]);

  if (friendshipsLoading) return <Loader />;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, people.length === 0 && styles.emptyContent]}
      data={people}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.request, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
          <Avatar uri={item.avatar} size={58} style={styles.avatar} accessibilityLabel={`${item.name}'s profile avatar`} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.bio, { color: theme.secondaryText }]} numberOfLines={1}>{item.bio}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.accept, { backgroundColor: theme.primary }]} onPress={() => acceptFriendRequest(item.id)}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.decline, { borderColor: theme.border }]} onPress={() => declineFriendRequest(item.id)}>
                <Text style={[styles.declineText, { color: theme.text }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppIcon name="user-check" size={30} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No pending requests</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>New friend requests will appear here.</Text>
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
});
