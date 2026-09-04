import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, View, FlatList, Linking, Modal, Pressable, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';
        import PostCard from '../../components/PostCard';
import Loader from '../../components/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import Icon from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useNotifications } from '../../context/NotificationsContext';

const mergeUniquePosts = (current, incoming) => {
  const postsById = new Map(current.map(post => [String(post.id), post]));
  incoming.forEach(post => postsById.set(String(post.id), post));
  return Array.from(postsById.values());
};

const fallbackFeedBanner = {
  mode: 'encouragement',
  label: "TODAY'S ENCOURAGEMENT",
  text: 'Let all that you do be done in love.',
  reference: '1 Corinthians 16:14',
};

        export default function HomeScreen({ navigation }) {
          const [posts, setPosts] = useState([]);
          const [loading, setLoading] = useState(true);
          const [refreshing, setRefreshing] = useState(false);
          const [loadingMore, setLoadingMore] = useState(false);
          const [nextPage, setNextPage] = useState(1);
          const [hasMorePosts, setHasMorePosts] = useState(true);
          const [loadError, setLoadError] = useState('');
          const [feedBanner, setFeedBanner] = useState(null);
          const [bannerDetailsVisible, setBannerDetailsVisible] = useState(false);
          const loadingMoreRef = useRef(false);
          const { theme } = useTheme();
          const { user, refreshUser } = useAuth();
          const { isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();
          const friendshipState = useFriendships();
          const blockedUserIds = Array.isArray(friendshipState?.blockedUserIds)
            ? friendshipState.blockedUserIds
            : [];
          const { unreadCount } = useNotifications();
          const tabBarHeight = useBottomTabBarHeight();
          const visiblePosts = useMemo(
            () => posts.filter(post => !blockedUserIds.includes(post.userId)),
            [posts, blockedUserIds],
          );

          const loadPosts = useCallback(async () => {
            try {
              setLoadError('');
              const data = await apiService.getPostsPage(1);
              setPosts(data.data);
              setNextPage(2);
              setHasMorePosts(data.hasMorePages);
            } catch (e) { setLoadError(e.message || 'Unable to load the timeline.'); }
            finally { setLoading(false); setRefreshing(false); }
          }, []);

          const loadFeedBanner = useCallback(async () => {
            try {
              setFeedBanner(await apiService.getFeedBanner());
            } catch (error) {
              console.error('Could not load the feed banner', error);
              setFeedBanner(current => current || fallbackFeedBanner);
            }
          }, []);

          const loadMorePosts = async () => {
            if (loadingMoreRef.current || !hasMorePosts) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
            try {
              const data = await apiService.getPostsPage(nextPage);
              setPosts(current => mergeUniquePosts(current, data.data));
              setNextPage(current => current + 1);
              setHasMorePosts(data.hasMorePages);
            } catch (e) { console.error(e); }
            finally { loadingMoreRef.current = false; setLoadingMore(false); }
          };

          useFocusEffect(useCallback(() => {
            loadPosts();
            loadFeedBanner();
            refreshUser().catch(error => console.error('Could not refresh user profile', error));
          }, [loadPosts, loadFeedBanner, refreshUser]));

          const deletePost = async post => {
            try {
              await apiService.deletePost(post.id);
              forgetDeletedPost(post.id);
              setPosts(current => current.filter(item => item.id !== post.id));
            } catch (error) {
              Alert.alert('Couldn’t delete post', error.message);
              throw error;
            }
          };

          const onRefresh = () => {
            setRefreshing(true);
            loadPosts();
            loadFeedBanner();
            refreshUser().catch(error => console.error('Could not refresh user profile', error));
          };
          const emailVerified = Boolean(user?.emailVerified);
          const openComposer = () => {
            if (!emailVerified) {
              Alert.alert('Verify your email', 'Verify your email before posting to the timeline or joining a community.', [
                { text: 'Not now', style: 'cancel' },
                { text: 'Verify email', onPress: () => navigation.navigate('Profile') },
              ]);
              return;
            }
            navigation.navigate('CreatePost');
          };

          const openAnnouncement = async () => {
            const url = feedBanner?.actionUrl?.trim();
            if (!url || !/^https:\/\//i.test(url)) {
              Alert.alert('Link unavailable', 'This announcement does not have a valid secure link.');
              return;
            }

            try {
              await Linking.openURL(url);
            } catch (error) {
              Alert.alert(
                'Couldn’t open link',
                'No browser could open this announcement link. Check that the emulator has a browser installed and that the URL is reachable.',
              );
            }
          };

          if (loading) return <Loader />;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ScreenHeader
                eyebrow="GOOD TO SEE YOU"
                title={`Hello, ${user?.name?.split(' ')[0] || 'friend'}`}
                actionIcon="notifications-outline"
                badgeCount={unreadCount}
                onAction={() => navigation.navigate('Notifications')}
              />
              {feedBanner ? (
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => setBannerDetailsVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details: ${feedBanner.title || feedBanner.label}`}
                  style={styles.bannerWrap}
                >
                  <LinearGradient colors={[theme.primary, theme.accentDark, theme.warmAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.compactBanner}>
                    <View style={styles.bannerIcon}>
                      <Icon name={feedBanner.mode === 'announcement' ? 'megaphone-outline' : 'sparkles-outline'} size={15} color="#FFFFFF" />
                    </View>
                    <View style={styles.bannerCopy}>
                      <View style={styles.bannerMeta}>
                        <Text style={styles.compactBannerLabel} numberOfLines={1}>{feedBanner.title || feedBanner.label}</Text>
                        {feedBanner.reference ? <Text style={styles.compactReference} numberOfLines={1}>{feedBanner.reference}</Text> : null}
                      </View>
                      <Text style={styles.compactBannerText} numberOfLines={1}>{feedBanner.mode === 'encouragement' ? `“${feedBanner.text}”` : feedBanner.text}</Text>
                    </View>
                    <Icon name="chevron-right" size={14} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.statusShortcut, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('Statuses')} accessibilityLabel="View friend statuses">
                <View style={[styles.statusShortcutIcon, { backgroundColor: theme.primarySoft }]}><Icon name="time-outline" size={18} color={theme.primary} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.statusShortcutTitle, { color: theme.text }]}>Friend statuses</Text><Text style={[styles.statusShortcutText, { color: theme.secondaryText }]}>Share text or photos that disappear in 24 hours</Text></View>
                <Icon name="chevron-right" size={18} color={theme.primary} />
              </TouchableOpacity>
              <FlatList
                data={visiblePosts}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                renderItem={({ item }) => (
                  <PostCard
                    post={item}
                    onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                    onOriginalPress={item.originalPost ? () => navigation.navigate('PostDetail', { postId: item.originalPost.id }) : undefined}
                    onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
                    onLike={() => apiService.likePost(item.id).then(updatedPost => {
                      setPosts(current => current.map(post => String(post.id) === String(item.id) ? updatedPost : post));
                    }).catch(error => {
                      if (error.message?.includes('No query results for model')) {
                        setPosts(current => current.filter(post => String(post.id) !== String(item.id)));
                      } else {
                        Alert.alert('Couldn’t update post', error.message);
                      }
                    })}
                    onShare={() => navigation.navigate('SharePost', { postId: item.id })}
                    onSave={() => toggleSavedPost(item.id)}
                    onEdit={String(item.userId) === String(user?.id) ? () => navigation.navigate('EditPost', { postId: item.id }) : undefined}
                    onDelete={String(item.userId) === String(user?.id) ? () => deletePost(item) : undefined}
                    isSaved={isPostSaved(item.id)}
                  />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                onEndReached={loadMorePosts}
                onEndReachedThreshold={0.5}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                updateCellsBatchingPeriod={50}
                windowSize={7}
                ListFooterComponent={loadingMore ? <View style={styles.loadingFooter}><ActivityIndicator color={theme.tint} /></View> : null}
                ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: theme.text }]}>{loadError ? 'Couldn’t load posts' : 'No posts yet'}</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>{loadError || 'New posts will appear here.'}</Text>{loadError ? <TouchableOpacity style={[styles.retry, { backgroundColor: theme.primary }]} onPress={loadPosts}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}</View>}
                ListHeaderComponent={
                  <>
                    {!emailVerified ? <TouchableOpacity activeOpacity={0.82} onPress={() => navigation.navigate('VerifyEmail')} style={[styles.verificationAlert, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                      <View style={[styles.verificationIcon, { backgroundColor: theme.card }]}><Icon name="mail-outline" size={20} color={theme.accent} /></View>
                      <View style={styles.verificationCopy}>
                        <Text style={[styles.verificationTitle, { color: theme.text }]}>Verify your email</Text>
                        <Text style={[styles.verificationText, { color: theme.secondaryText }]} numberOfLines={1}>Required to post or join communities</Text>
                      </View>
                      <Icon name="chevron-right" size={16} color={theme.accent} />
                    </TouchableOpacity> : null}
                    <TouchableOpacity style={[styles.composer, { backgroundColor: theme.card, borderColor: emailVerified ? theme.border : theme.accent }]} onPress={openComposer}>
                      <View style={[styles.composerIcon, { backgroundColor: theme.primarySoft }]}><Icon name="create-outline" size={20} color={theme.primary} /></View>
                      <Text style={[styles.composerText, { color: theme.secondaryText }]}>Share an update or prayer...</Text>
                      <Icon name="image-outline" size={21} color={theme.primary} />
                    </TouchableOpacity>
                  </>
                }
              />
              <Modal visible={bannerDetailsVisible} transparent animationType="fade" onRequestClose={() => setBannerDetailsVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setBannerDetailsVisible(false)}>
                  <Pressable style={[styles.bannerModal, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIcon, { backgroundColor: theme.primarySoft }]}>
                        <Icon name={feedBanner?.mode === 'announcement' ? 'megaphone-outline' : 'sparkles-outline'} size={20} color={theme.primary} />
                      </View>
                      <View style={styles.modalHeadingCopy}>
                        <Text style={[styles.modalLabel, { color: theme.primary }]}>{feedBanner?.label}</Text>
                        {feedBanner?.title ? <Text style={[styles.modalTitle, { color: theme.text }]}>{feedBanner.title}</Text> : null}
                      </View>
                      <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.background }]} onPress={() => setBannerDetailsVisible(false)} accessibilityLabel="Close banner details">
                        <Icon name="times" size={18} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.modalMessage, { color: theme.text }]}>{feedBanner?.mode === 'encouragement' ? `“${feedBanner?.text}”` : feedBanner?.text}</Text>
                    {feedBanner?.reference ? <Text style={[styles.modalReference, { color: theme.secondaryText }]}>{feedBanner.reference}</Text> : null}
                    {feedBanner?.mode === 'announcement' && feedBanner?.actionUrl ? (
                      <TouchableOpacity style={[styles.modalAction, { backgroundColor: theme.primary }]} onPress={() => { setBannerDetailsVisible(false); openAnnouncement(); }} accessibilityRole="link">
                        <Text style={styles.modalActionText}>{feedBanner.actionLabel || 'Learn more'}</Text>
                        <Icon name="arrow-forward" size={15} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : null}
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          loadingFooter: { paddingVertical: 20, alignItems: 'center' },
          bannerWrap: { marginHorizontal: 14, marginBottom: 8 },
          statusShortcut: { marginHorizontal: 14, marginBottom: 10, padding: 11, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
          statusShortcutIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          statusShortcutTitle: { fontSize: 12, fontWeight: '800' },
          statusShortcutText: { fontSize: 10, marginTop: 2 },
          compactBanner: { minHeight: 52, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
          bannerIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
          bannerCopy: { flex: 1, minWidth: 0 },
          bannerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
          compactBannerLabel: { flex: 1, color: 'rgba(255,255,255,.8)', fontSize: 8, lineHeight: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
          compactBannerText: { color: '#FFFFFF', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 1 },
          compactReference: { color: 'rgba(255,255,255,.76)', fontSize: 8.5, lineHeight: 11 },
          modalBackdrop: { flex: 1, paddingHorizontal: 22, backgroundColor: 'rgba(0,0,0,.52)', alignItems: 'center', justifyContent: 'center' },
          bannerModal: { width: '100%', maxWidth: 440, padding: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
          modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
          modalIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
          modalHeadingCopy: { flex: 1, minWidth: 0 },
          modalLabel: { fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
          modalTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', marginTop: 2 },
          modalClose: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          modalMessage: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 18 },
          modalReference: { fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 9 },
          modalAction: { minHeight: 44, marginTop: 20, paddingHorizontal: 16, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
          modalActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
          composer: { marginHorizontal: 14, marginBottom: 16, padding: 12, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
          composerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
          composerText: { flex: 1, fontSize: 13 },
          verificationAlert: { marginHorizontal: 14, marginBottom: 10, paddingHorizontal: 11, minHeight: 58, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
          verificationIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          verificationCopy: { flex: 1 },
          verificationTitle: { fontSize: 12, fontWeight: '800' },
          verificationText: { fontSize: 10, marginTop: 2 },
          empty: { alignItems: 'center', padding: 28 },
          emptyTitle: { fontSize: 17, fontWeight: '700' },
          emptyText: { marginTop: 6, textAlign: 'center' },
          retry: { marginTop: 15, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
          retryText: { color: '#FFFFFF', fontWeight: '700' },
        });
      
