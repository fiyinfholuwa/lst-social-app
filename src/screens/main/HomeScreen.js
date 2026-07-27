import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text, ScrollView, Share } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';
        import PostCard from '../../components/PostCard';
import Loader from '../../components/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import Icon from '../../components/AppIcon';
import { useSavedPosts } from '../../context/SavedPostsContext';

const filters = ['For you', 'Prayer', 'Testimonies', 'Relationships'];

        export default function HomeScreen({ navigation }) {
          const [posts, setPosts] = useState([]);
          const [loading, setLoading] = useState(true);
          const [refreshing, setRefreshing] = useState(false);
          const { theme } = useTheme();
          const { user } = useAuth();
          const [activeFilter, setActiveFilter] = useState('For you');
          const { isPostSaved, toggleSavedPost } = useSavedPosts();

          const sharePost = post => Share.share({
            title: `${post.userName} on LST Social`,
            message: `${post.userName} shared on LST Social:\n\n${post.content}`,
          });

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
              <ScreenHeader eyebrow="GOOD TO SEE YOU" title={`Hello, ${user?.name?.split(' ')[0] || 'friend'}`} actionIcon="notifications-outline" />
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedContent}
                renderItem={({ item }) => (
                  <PostCard
                    post={item}
                    onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                    onLike={() => apiService.likePost(item.id).then(loadPosts)}
                    onShare={() => sharePost(item)}
                    onSave={() => toggleSavedPost(item.id)}
                    isSaved={isPostSaved(item.id)}
                  />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                ListHeaderComponent={
                  <>
                    <View style={[styles.verseCard, { backgroundColor: theme.primary }]}>
                      <Text style={styles.verseLabel}>TODAY'S ENCOURAGEMENT</Text>
                      <Text style={styles.verse}>“Let all that you do be done in love.”</Text>
                      <Text style={styles.reference}>1 Corinthians 16:14</Text>
                    </View>
                    <TouchableOpacity style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.navigate('CreatePost')}>
                      <View style={[styles.composerIcon, { backgroundColor: theme.primarySoft }]}><Icon name="create-outline" size={20} color={theme.primary} /></View>
                      <Text style={[styles.composerText, { color: theme.secondaryText }]}>Share an update or prayer...</Text>
                      <Icon name="image-outline" size={21} color={theme.primary} />
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                      {filters.map(filter => (
                        <TouchableOpacity key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filter, { borderColor: theme.border }, filter === activeFilter && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                          <Text style={[styles.filterText, { color: theme.secondaryText }, filter === activeFilter && { color: '#fff' }]}>{filter}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                }
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          feedContent: { paddingBottom: 94 },
          verseCard: { marginHorizontal: 14, padding: 20, borderRadius: 22, marginBottom: 12 },
          verseLabel: { color: 'rgba(255,255,255,.68)', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
          verse: { color: '#fff', fontSize: 21, fontWeight: '700', lineHeight: 29, marginTop: 11 },
          reference: { color: 'rgba(255,255,255,.76)', fontSize: 13, marginTop: 8 },
          composer: { marginHorizontal: 14, padding: 12, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
          composerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
          composerText: { flex: 1, fontSize: 13 },
          filters: { paddingHorizontal: 14, paddingVertical: 16, gap: 8 },
          filter: { paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1, borderRadius: 999 },
          filterText: { fontSize: 12, fontWeight: '700' },
        });
      
