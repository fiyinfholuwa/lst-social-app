import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import { useFriendships } from '../../context/FriendshipsContext';
import { useTheme } from '../../context/ThemeContext';

export default function BlockedAccountsScreen({ navigation }) {
  const { theme } = useTheme();
  const { blockedUserIds, unblockUser } = useFriendships();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    Promise.all(blockedUserIds.map(id => apiService.getUser(id))).then(results => setPeople(results.filter(Boolean)));
  }, [blockedUserIds]);

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, people.length === 0 && styles.emptyContent]}
      data={people}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.status, { color: theme.secondaryText }]}>Blocked account</Text>
          </View>
          <TouchableOpacity style={[styles.unblock, { borderColor: theme.border }]} onPress={() => unblockUser(item.id)}>
            <Text style={[styles.unblockText, { color: theme.primary }]}>Unblock</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <TouchableOpacity style={[styles.friendsLink, { backgroundColor: theme.primarySoft }]} onPress={() => navigation.navigate('Friends')}>
          <AppIcon name="users" size={15} color={theme.primary} />
          <Text style={[styles.friendsText, { color: theme.primary }]}>View all friends</Text>
          <AppIcon name="chevron-right" size={13} color={theme.primary} />
        </TouchableOpacity>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <AppIcon name="shield-alt" size={30} color={theme.secondaryText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No blocked accounts</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Accounts you block will be listed here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 14 },
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
});
