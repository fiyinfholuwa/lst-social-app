import React, { useCallback, useEffect, useState } from 'react';
        import { ActivityIndicator, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import { useFriendships } from '../../context/FriendshipsContext';
        import AppIcon from '../../components/AppIcon';
        import Avatar from '../../components/Avatar';
import Loader from '../../components/Loader';
import EmojiText from '../../components/EmojiText';
import { useChatUnread } from '../../context/ChatUnreadContext';

        export default function ChatsScreen({ navigation }) {
          const [chats, setChats] = useState([]);
          const [loading, setLoading] = useState(true);
          const [query, setQuery] = useState('');
          const [chatPage, setChatPage] = useState(1);
          const [hasMoreChats, setHasMoreChats] = useState(false);
          const [loadingMoreChats, setLoadingMoreChats] = useState(false);
          const { theme } = useTheme();
          const { friendIds, incomingRequestIds, blockedUserIds } = useFriendships();
          const { refreshUnreadChats } = useChatUnread();
          const tabBarHeight = useBottomTabBarHeight();

          useFocusEffect(useCallback(() => { setQuery(''); loadChats(1, ''); }, []));

          const loadChats = async (page = 1, searchTerm = query) => {
            try {
              const response = await apiService.getChatsPage(page, searchTerm);
              setChats(response.data || []);
              setChatPage(response.currentPage || 1);
              setHasMoreChats(Boolean(response.hasMorePages));
              refreshUnreadChats();
            } catch (error) {
              console.error('Unable to load chats:', error);
            } finally {
              setLoading(false);
            }
          };

          useEffect(() => {
            const timer = setTimeout(() => loadChats(1, query), 300);
            return () => clearTimeout(timer);
          }, [query]);

          const loadMoreChats = async () => {
            if (!hasMoreChats || loadingMoreChats) return;
            setLoadingMoreChats(true);
            try {
              const response = await apiService.getChatsPage(chatPage + 1, query);
              setChats(current => {
                const known = new Set(current.map(chat => String(chat.id)));
                return [...current, ...(response.data || []).filter(chat => !known.has(String(chat.id)))];
              });
              setChatPage(response.currentPage);
              setHasMoreChats(Boolean(response.hasMorePages));
            } catch (error) {
              console.error('Unable to load more chats:', error);
            } finally {
              setLoadingMoreChats(false);
            }
          };

          if (loading) return <Loader />;

          const search = query.trim();
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
              <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <AppIcon name="search" size={17} color={theme.secondaryText} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search conversations"
                  placeholderTextColor={theme.secondaryText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {query ? <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear chat search"><AppIcon name="times-circle" size={18} color={theme.secondaryText} /></TouchableOpacity> : null}
              </View>
              <FlatList
                data={visibleChats}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }, visibleChats.length === 0 && styles.emptyList]}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chatItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, userName: item.withUser.name })}
                  >
                    <Avatar uri={item.withUser.avatar} size={50} style={styles.avatar} accessibilityLabel={`${item.withUser.name}'s profile avatar`} />
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]}>{item.withUser.name}</Text>
                      <EmojiText style={[styles.lastMsg, { color: theme.secondaryText }]} numberOfLines={1}>{item.lastMessage}</EmojiText>
                    </View>
                    <View style={styles.deliveryMeta}>
                      <Text style={[styles.time, { color: theme.secondaryText }]}>{item.timestamp}</Text>
                      {item.lastMessageMine ? <AppIcon name={item.lastMessageRead ? 'checkmark-done' : 'check'} size={14} color={item.lastMessageRead ? '#22A06B' : theme.secondaryText} /> : null}
                    </View>
                    {item.unreadCount ? <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}><Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View> : null}
                  </TouchableOpacity>
                )}
                onEndReached={loadMoreChats}
                onEndReachedThreshold={0.4}
                ListFooterComponent={loadingMoreChats ? <ActivityIndicator style={styles.moreLoader} color={theme.primary} /> : null}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
                      <AppIcon name="chatbubbles-outline" size={30} color={theme.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>{search ? 'No conversations found' : 'No messages yet'}</Text>
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                      {search
                        ? 'Try searching for another name or message.'
                        : hasFriends
                        ? 'Start a private conversation with one of your friends.'
                        : 'Find someone you know, send a friend request, and start chatting once they accept.'}
                    </Text>
                    {!search ? <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('Friends')}>
                      <AppIcon name={hasFriends ? 'comment' : 'user-plus'} size={16} color="#FFFFFF" />
                      <Text style={styles.emptyButtonText}>{hasFriends ? 'Message a friend' : 'Find friends'}</Text>
                    </TouchableOpacity> : null}
                  </View>
                }
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          listContent: { paddingTop: 2 },
          emptyList: { flexGrow: 1 },
          requestBanner: { marginHorizontal: 14, marginBottom: 12, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
          requestText: { flex: 1, fontSize: 13, fontWeight: '700' },
          searchBox: { minHeight: 46, marginHorizontal: 14, marginBottom: 12, paddingHorizontal: 13, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
          searchInput: { flex: 1, fontSize: 13, paddingVertical: 10 },
          chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 9, marginHorizontal: 14 },
          avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
          info: { flex: 1 },
          name: { fontWeight: '700', fontSize: 15 },
          lastMsg: { fontSize: 12, lineHeight: 18, marginTop: 3 },
          deliveryMeta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, marginLeft: 8 },
          time: { fontSize: 10 },
          unreadBadge: { position: 'absolute', right: 13, bottom: 12, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
          unreadBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 70 },
          emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
          emptyTitle: { marginTop: 17, fontSize: 19, fontWeight: '700' },
          emptyText: { maxWidth: 310, marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: 'center' },
          emptyButton: { height: 44, marginTop: 20, paddingHorizontal: 18, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
          emptyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
          moreLoader: { paddingVertical: 18 },
        });
      
