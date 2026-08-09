import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

        export default function HomeScreen({ navigation }) {
          const [posts, setPosts] = useState([]);
          const [loading, setLoading] = useState(true);
          const [refreshing, setRefreshing] = useState(false);
          const [loadingMore, setLoadingMore] = useState(false);
          const [nextPage, setNextPage] = useState(1);
          const [hasMorePosts, setHasMorePosts] = useState(true);
          const { theme } = useTheme();
          const { user } = useAuth();
          const { isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();
          const friendshipState = useFriendships();
          const blockedUserIds = Array.isArray(friendshipState?.blockedUserIds)
            ? friendshipState.blockedUserIds
            : [];
          const { unreadCount } = useNotifications();

          const sharePost = post => Share.share({
            title: `${post.userName} on LST Social`,
            message: `${post.userName} shared on LST Social:\n\n${post.content}`,
          });

          const loadPosts = useCallback(async () => {
            try {
              const data = await apiService.getPostsPage(1);
              setPosts(data.data);
              setNextPage(2);
              setHasMorePosts(data.hasMorePages);
            } catch (e) { console.error(e); }
            finally { setLoading(false); setRefreshing(false); }
          }, []);

          const loadMorePosts = async () => {
            if (loadingMore || !hasMorePosts) return;
            setLoadingMore(true);
            try {
              const data = await apiService.getPostsPage(nextPage);
              setPosts(current => [...current, ...data.data]);
              setNextPage(current => current + 1);
              setHasMorePosts(data.hasMorePages);
            } catch (e) { console.error(e); }
            finally { setLoadingMore(false); }
          };

          useFocusEffect(useCallback(() => { loadPosts(); }, [loadPosts]));

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

          const onRefresh = () => { setRefreshing(true); loadPosts(); };
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
              <FlatList
                data={posts.filter(post => !blockedUserIds.includes(post.userId))}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedContent}
                renderItem={({ item }) => (
                  <PostCard
                    post={item}
                    onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                    onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
                    onLike={() => apiService.likePost(item.id).then(loadPosts)}
                    onShare={() => sharePost(item)}
                    onSave={() => toggleSavedPost(item.id)}
                    onEdit={String(item.userId) === String(user?.id) ? () => navigation.navigate('EditPost', { postId: item.id }) : undefined}
                    onDelete={String(item.userId) === String(user?.id) ? () => deletePost(item) : undefined}
                    isSaved={isPostSaved(item.id)}
                  />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                onEndReached={loadMorePosts}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <View style={styles.loadingFooter}><ActivityIndicator color={theme.tint} /></View> : null}
                ListHeaderComponent={
                  <>
                    <LinearGradient
                      colors={[theme.primary, theme.accentDark, theme.warmAccent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.verseCard}
                    >
                      <Text style={styles.verseLabel}>TODAY'S ENCOURAGEMENT</Text>
                      <Text style={styles.verse}>“Let all that you do be done in love.”</Text>
                      <Text style={styles.reference}>1 Corinthians 16:14</Text>
                    </LinearGradient>
                    {!emailVerified ? <TouchableOpacity activeOpacity={0.82} onPress={() => navigation.navigate('Profile')} style={[styles.verificationAlert, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
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
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          feedContent: { paddingBottom: 94 },
          loadingFooter: { paddingVertical: 20, alignItems: 'center' },
          verseCard: { marginHorizontal: 14, padding: 20, borderRadius: 22, marginBottom: 12 },
          verseLabel: { color: 'rgba(255,255,255,.82)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
          verse: { color: '#fff', fontSize: 21, fontWeight: '700', lineHeight: 29, marginTop: 11 },
          reference: { color: 'rgba(255,255,255,.76)', fontSize: 13, marginTop: 8 },
          composer: { marginHorizontal: 14, marginBottom: 16, padding: 12, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
          composerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
          composerText: { flex: 1, fontSize: 13 },
          verificationAlert: { marginHorizontal: 14, marginBottom: 10, paddingHorizontal: 11, minHeight: 58, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
          verificationIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
          verificationCopy: { flex: 1 },
          verificationTitle: { fontSize: 12, fontWeight: '800' },
          verificationText: { fontSize: 10, marginTop: 2 },
        });
      
