import React, { useCallback, useState } from 'react';
        import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import { useFriendships } from '../../context/FriendshipsContext';
        import AppIcon from '../../components/AppIcon';
        import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';

        export default function ChatsScreen({ navigation }) {
          const [chats, setChats] = useState([]);
          const [loading, setLoading] = useState(true);
          const { theme } = useTheme();
          const { friendIds, incomingRequestIds, blockedUserIds } = useFriendships();

          useFocusEffect(useCallback(() => { loadChats(); }, []));

          const loadChats = async () => {
            try {
              const data = await apiService.getChats();
              setChats(data);
            } catch (error) {
              console.error('Unable to load chats:', error);
            } finally {
              setLoading(false);
            }
          };

          if (loading) return <Loader />;

          const visibleChats = chats.filter(chat => friendIds.includes(chat.withUser.id) && !blockedUserIds.includes(chat.withUser.id));
          const hasFriends = friendIds.length > 0;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ScreenHeader eyebrow="FRIENDS ONLY" title="Messages" actionIcon="user-plus" onAction={() => navigation.navigate('Friends')} />
              {incomingRequestIds.length > 0 ? (
                <TouchableOpacity style={[styles.requestBanner, { backgroundColor: theme.primarySoft }]} onPress={() => navigation.navigate('FriendRequests')}>
                  <AppIcon name="user-plus" size={16} color={theme.primary} />
                  <Text style={[styles.requestText, { color: theme.primary }]}>{incomingRequestIds.length} friend request{incomingRequestIds.length > 1 ? 's' : ''}</Text>
                  <AppIcon name="chevron-right" size={13} color={theme.primary} />
                </TouchableOpacity>
              ) : null}
              <FlatList
                data={visibleChats}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, visibleChats.length === 0 && styles.emptyList]}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chatItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, userName: item.withUser.name })}
                  >
                    <Avatar uri={item.withUser.avatar} size={50} style={styles.avatar} accessibilityLabel={`${item.withUser.name}'s profile avatar`} />
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]}>{item.withUser.name}</Text>
                      <Text style={[styles.lastMsg, { color: theme.secondaryText }]}>{item.lastMessage}</Text>
                    </View>
                    <Text style={[styles.time, { color: theme.secondaryText }]}>{item.timestamp}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
                      <AppIcon name="chatbubbles-outline" size={30} color={theme.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No messages yet</Text>
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                      {hasFriends
                        ? 'Start a private conversation with one of your friends.'
                        : 'Find someone you know, send a friend request, and start chatting once they accept.'}
                    </Text>
                    <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('Friends')}>
                      <AppIcon name={hasFriends ? 'comment' : 'user-plus'} size={16} color="#FFFFFF" />
                      <Text style={styles.emptyButtonText}>{hasFriends ? 'Message a friend' : 'Find friends'}</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          listContent: { paddingBottom: 94 },
          emptyList: { flexGrow: 1 },
          requestBanner: { marginHorizontal: 14, marginBottom: 12, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
          requestText: { flex: 1, fontSize: 13, fontWeight: '700' },
          chatItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10, marginHorizontal: 14 },
          avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
          info: { flex: 1 },
          name: { fontWeight: '600', fontSize: 16 },
          lastMsg: { fontSize: 14 },
          time: { fontSize: 12 },
          emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 70 },
          emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
          emptyTitle: { marginTop: 17, fontSize: 19, fontWeight: '700' },
          emptyText: { maxWidth: 310, marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: 'center' },
          emptyButton: { height: 44, marginTop: 20, paddingHorizontal: 18, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
          emptyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
        });
      
