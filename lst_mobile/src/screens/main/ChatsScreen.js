import React, { useCallback, useEffect, useState } from 'react';
	        import { ActivityIndicator, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
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
	          const [refreshing, setRefreshing] = useState(false);
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

	          const refreshChats = async () => {
	            setRefreshing(true);
	            await loadChats(1, query);
	            setRefreshing(false);
	          };

          if (loading) return <Loader />;

          const search = query.trim();
          const visibleChats = chats.filter(chat => friendIds.includes(chat.withUser.id) && !blockedUserIds.includes(chat.withUser.id));
	          const hasFriends = friendIds.length > 0;
	          const unreadConversations = visibleChats.filter(chat => Number(chat.unreadCount) > 0).length;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
	              <ScreenHeader eyebrow="PRIVATE CONVERSATIONS" title="Messages" actionIcon="user-plus" onAction={() => navigation.navigate('Friends')} />
	              <View style={styles.introRow}>
	                <Text style={[styles.introText, { color: theme.secondaryText }]}>Stay close to the people who matter.</Text>
	                {unreadConversations > 0 ? <View style={[styles.unreadSummary, { backgroundColor: theme.primarySoft }]}><Text style={[styles.unreadSummaryText, { color: theme.primary }]}>{unreadConversations} unread</Text></View> : null}
	              </View>
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
	                    style={[styles.chatItem, { backgroundColor: item.unreadCount ? theme.primarySoft : theme.card, borderColor: item.unreadCount ? theme.primary : theme.border }]}
	                    onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, userName: item.withUser.name })}
	                    activeOpacity={0.72}
	                  >
	                    <View style={styles.avatarWrap}>
	                      <Avatar uri={item.withUser.avatar} size={52} style={styles.avatar} accessibilityLabel={`${item.withUser.name}'s profile avatar`} />
	                      {item.unreadCount ? <View style={[styles.activityDot, { backgroundColor: theme.primary, borderColor: theme.primarySoft }]} /> : null}
	                    </View>
	                    <View style={styles.info}>
	                      <View style={styles.nameRow}>
	                        <Text style={[styles.name, item.unreadCount && styles.unreadName, { color: theme.text }]} numberOfLines={1}>{item.withUser.name}</Text>
	                        <Text style={[styles.time, item.unreadCount && styles.unreadTime, { color: item.unreadCount ? theme.primary : theme.secondaryText }]}>{item.timestamp}</Text>
	                      </View>
	                      <View style={styles.previewRow}>
	                        {item.lastMessageMine ? <AppIcon name={item.lastMessageRead ? 'checkmark-done' : 'check'} size={14} color={item.lastMessageRead ? '#22A06B' : theme.secondaryText} /> : null}
	                        <EmojiText style={[styles.lastMsg, item.unreadCount && styles.unreadMessage, { color: item.unreadCount ? theme.text : theme.secondaryText }]} numberOfLines={1}>{item.lastMessage || 'Start a conversation'}</EmojiText>
	                      </View>
	                    </View>
                    {item.unreadCount ? <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}><Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View> : null}
                  </TouchableOpacity>
                )}
                onEndReached={loadMoreChats}
                onEndReachedThreshold={0.4}
	                ListFooterComponent={loadingMoreChats ? <ActivityIndicator style={styles.moreLoader} color={theme.primary} /> : null}
	                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshChats} tintColor={theme.primary} colors={[theme.primary]} />}
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
	          introRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: -8, marginBottom: 14 },
	          introText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
	          unreadSummary: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
	          unreadSummaryText: { fontSize: 10.5, fontWeight: '800' },
	          listContent: { paddingTop: 1 },
          emptyList: { flexGrow: 1 },
          requestBanner: { marginHorizontal: 14, marginBottom: 12, padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
          requestText: { flex: 1, fontSize: 13, fontWeight: '700' },
	          searchBox: { minHeight: 48, marginHorizontal: 14, marginBottom: 14, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
	          searchInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
	          chatItem: { flexDirection: 'row', alignItems: 'center', minHeight: 78, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, marginHorizontal: 14 },
	          avatarWrap: { marginRight: 12 },
	          avatar: { width: 52, height: 52, borderRadius: 26 },
	          activityDot: { position: 'absolute', right: 0, bottom: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2.5 },
	          info: { flex: 1 },
	          nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	          name: { flex: 1, fontWeight: '700', fontSize: 15 },
	          unreadName: { fontWeight: '800' },
	          previewRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingRight: 28 },
	          lastMsg: { flex: 1, fontSize: 12.5, lineHeight: 18 },
	          unreadMessage: { fontWeight: '600' },
	          time: { fontSize: 10.5 },
	          unreadTime: { fontWeight: '800' },
	          unreadBadge: { position: 'absolute', right: 14, bottom: 13, minWidth: 21, height: 21, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          unreadBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 70 },
          emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
          emptyTitle: { marginTop: 17, fontSize: 19, fontWeight: '700' },
          emptyText: { maxWidth: 310, marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: 'center' },
          emptyButton: { height: 44, marginTop: 20, paddingHorizontal: 18, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
          emptyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
          moreLoader: { paddingVertical: 18 },
        });
      
