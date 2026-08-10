import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import PostCard from '../../components/PostCard';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useTheme } from '../../context/ThemeContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useAuth } from '../../context/AuthContext';

export default function SavedPostsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { savedPostsLoading, isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const friendshipState = useFriendships();
  const blockedUserIds = Array.isArray(friendshipState?.blockedUserIds) ? friendshipState.blockedUserIds : [];

  const loadSavedPosts = useCallback(async (requestedPage = 1) => {
    if (requestedPage === 1) setLoading(true); else setLoadingMore(true);
    try {
      const response = await apiService.getSavedPostsPage(requestedPage);
      setPosts(current => requestedPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.currentPage);
      setHasMore(Boolean(response.hasMorePages));
    } catch (error) {
      Alert.alert('Couldn’t load saved posts', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadSavedPosts(); }, [loadSavedPosts]);

  const sharePost = post => navigation.navigate('SharePost', { postId: post.id });

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

  if (savedPostsLoading || loading) return <Loader />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={posts.filter(post => !blockedUserIds.includes(post.userId))}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.content, posts.length === 0 && styles.emptyContent]}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onOriginalPress={item.originalPost ? () => navigation.navigate('PostDetail', { postId: item.originalPost.id }) : undefined}
            onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            onLike={() => apiService.likePost(item.id).then(() => loadSavedPosts(1)).catch(error => Alert.alert('Couldn’t update post', error.message))}
            onShare={() => sharePost(item)}
            onSave={() => toggleSavedPost(item.id).then(saved => { if (!saved) setPosts(current => current.filter(post => post.id !== item.id)); })}
            onEdit={String(item.userId) === String(user?.id) ? () => navigation.navigate('EditPost', { postId: item.id }) : undefined}
            onDelete={String(item.userId) === String(user?.id) ? () => deletePost(item) : undefined}
            isSaved={isPostSaved(item.id)}
          />
        )}
        onEndReached={() => hasMore && !loadingMore && loadSavedPosts(page + 1)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <AppIcon name="bookmark" size={25} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved posts yet</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              Tap the bookmark icon on a post to keep it here for later.
            </Text>
            <TouchableOpacity style={[styles.browseButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('MainTabs')}>
              <Text style={styles.browseText}>Browse posts</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 14, paddingBottom: 30 },
  emptyContent: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 38 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  browseButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14 },
  browseText: { color: '#FFFFFF', fontWeight: '700' },
  footer: { paddingVertical: 18 },
});
