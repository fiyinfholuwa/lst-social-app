import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import PostCard from '../../components/PostCard';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useTheme } from '../../context/ThemeContext';
import { useFriendships } from '../../context/FriendshipsContext';

export default function SavedPostsScreen({ navigation }) {
  const { theme } = useTheme();
  const { savedPostIds, savedPostsLoading, isPostSaved, toggleSavedPost } = useSavedPosts();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { blockedUserIds } = useFriendships();

  const loadSavedPosts = useCallback(async () => {
    const results = await Promise.all(savedPostIds.map(id => apiService.getPost(id)));
    setPosts(results.filter(Boolean));
    setLoading(false);
  }, [savedPostIds]);

  useEffect(() => { loadSavedPosts(); }, [loadSavedPosts]);

  const sharePost = post => Share.share({
    title: `${post.userName} on LST Social`,
    message: `${post.userName} shared on LST Social:\n\n${post.content}`,
  });

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
            onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            onLike={() => apiService.likePost(item.id).then(loadSavedPosts)}
            onShare={() => sharePost(item)}
            onSave={() => toggleSavedPost(item.id)}
            isSaved={isPostSaved(item.id)}
          />
        )}
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
});
