import React, { useState, useEffect } from 'react';
        import { View, Text, Image, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';

        export default function PostDetailScreen({ route }) {
          const { postId } = route.params;
          const [post, setPost] = useState(null);
          const [commentText, setCommentText] = useState('');
          const { user } = useAuth();
          const { theme } = useTheme();

          useEffect(() => { loadPost(); }, []);

          const loadPost = async () => {
            const data = await apiService.getPost(postId);
            setPost(data);
          };

          const handleComment = async () => {
            if (!user) {
              Alert.alert('Authentication Required', 'Please log in to comment.');
              return;
            }
            if (!commentText.trim()) return;
            await apiService.addComment(postId, commentText);
            setCommentText('');
            loadPost();
          };

          if (!post) return null;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <FlatList
                data={post.comments}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                  <>
                    <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.header}>
                        <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                        <View>
                          <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
                          <Text style={[styles.timestamp, { color: theme.secondaryText }]}>{post.timestamp}</Text>
                        </View>
                      </View>
                      <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
                      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}
                      <Text style={[styles.likeCount, { color: theme.secondaryText }]}>❤️ {post.likes} likes</Text>
                    </View>
                    <Text style={[styles.commentHeader, { color: theme.text }]}>Comments</Text>
                  </>
                }
                renderItem={({ item }) => (
                  <View style={[styles.commentItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.commentUser, { color: theme.text }]}>{item.userName}</Text>
                    <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>
                    <Text style={[styles.commentTime, { color: theme.secondaryText }]}>{item.timestamp}</Text>
                  </View>
                )}
                ListFooterComponent={
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                      placeholder="Write a comment..."
                      placeholderTextColor={theme.secondaryText}
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={handleComment}>
                      <Text style={styles.sendText}>Post</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1, padding: 12 },
          postCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
          header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
          avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
          userName: { fontWeight: '600', fontSize: 16 },
          timestamp: { fontSize: 12 },
          content: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
          image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8, resizeMode: 'cover' },
          likeCount: { fontSize: 14 },
          commentHeader: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
          commentItem: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
          commentUser: { fontWeight: '600', fontSize: 14 },
          commentText: { fontSize: 14, marginVertical: 2 },
          commentTime: { fontSize: 12, marginTop: 4 },
          commentInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
          input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginRight: 8 },
          sendButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
          sendText: { color: '#fff', fontWeight: '600' },
        });
      