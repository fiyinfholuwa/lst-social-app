import React, { useState, useEffect, useCallback } from 'react';
        import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';
        import PostCard from '../../components/PostCard';
        import Loader from '../../components/Loader';

        export default function HomeScreen({ navigation }) {
          const [posts, setPosts] = useState([]);
          const [loading, setLoading] = useState(true);
          const [refreshing, setRefreshing] = useState(false);
          const { theme } = useTheme();
          const { user } = useAuth();

          const loadPosts = useCallback(async () => {
            try {
              const data = await apiService.getPosts();
              setPosts(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); setRefreshing(false); }
          }, []);

          useEffect(() => { loadPosts(); }, []);

          const onRefresh = () => { setRefreshing(true); loadPosts(); };

          if (loading) return <Loader />;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PostCard
                    post={item}
                    onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                    onLike={() => apiService.likePost(item.id).then(loadPosts)}
                  />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                ListHeaderComponent={
                  <TouchableOpacity style={[styles.createButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('CreatePost')}>
                    <Text style={styles.createButtonText}>+ New Post</Text>
                  </TouchableOpacity>
                }
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          createButton: { padding: 12, margin: 12, borderRadius: 8, alignItems: 'center' },
          createButtonText: { color: '#fff', fontWeight: '600' },
        });
      