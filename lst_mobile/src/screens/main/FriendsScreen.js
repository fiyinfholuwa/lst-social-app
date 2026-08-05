import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function FriendsScreen({ navigation }) {
  const { theme } = useTheme();
  const { friendIds, blockedUserIds, blockUser, friendshipsLoading } = useFriendships();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    Promise.all(friendIds.map(id => apiService.getUser(id))).then(results => setFriends(results.filter(Boolean)));
  }, [friendIds]);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={[styles.blockedLink, { backgroundColor: theme.primarySoft }]} onPress={() => navigation.navigate('BlockedAccounts')}>
        <AppIcon name="ban" size={15} color={theme.primary} />
        <Text style={[styles.blockedText, { color: theme.primary }]}>Blocked accounts</Text>
        <Text style={[styles.blockedCount, { color: theme.primary }]}>{blockedUserIds.length}</Text>
        <AppIcon name="chevron-right" size={13} color={theme.primary} />
      </TouchableOpacity>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.content, friends.length === 0 && styles.emptyContent]}
        renderItem={({ item }) => (
          <View style={[styles.friendRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.profileArea} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.bio, { color: theme.secondaryText }]} numberOfLines={1}>{item.bio}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.primarySoft }]} onPress={() => openChat(item)} accessibilityLabel={`Message ${item.name}`}>
              <AppIcon name="comment" size={15} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => confirmBlock(item)} accessibilityLabel={`Block ${item.name}`}>
              <AppIcon name="ban" size={15} color={theme.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="users" size={31} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No friends yet</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Accepted friend requests will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blockedLink: { margin: 14, marginBottom: 4, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  blockedText: { flex: 1, fontSize: 13, fontWeight: '700' },
  blockedCount: { fontSize: 12, fontWeight: '700' },
  content: { padding: 14 },
  emptyContent: { flexGrow: 1 },
  friendRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 17, marginBottom: 10, gap: 7 },
  profileArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  bio: { fontSize: 11, marginTop: 3 },
  iconButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, marginTop: 5 },
});
