import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import { useSavedPosts } from '../../context/SavedPostsContext';

export default function PostScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isPostSaved, toggleSavedPost } = useSavedPosts();

  useEffect(() => { loadPost(); }, [postId]);

  const loadPost = async () => {
    const data = await apiService.getPost(postId);
    setPost(data);
  };

  const handleLike = async () => {
    await apiService.likePost(postId);
    loadPost();
  };

  const handleShare = () => Share.share({
    title: `${post.userName} on LST Social`,
    message: `${post.userName} shared on LST Social:\n\n${post.content}`,
  });

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to comment.');
      return;
    }
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      await apiService.addComment(postId, commentText.trim());
      setCommentText('');
      await loadPost();
    } finally {
      setSending(false);
    }
  };

  if (!post) return <Loader />;

  const postType = post.type || (post.communityId ? 'Community' : 'Encouragement');

  const PostContent = () => (
    <>
      <View style={styles.postCard}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: post.userId })}>
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.author}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
              {post.verified ? <AppIcon name="check-circle" solid size={14} color={theme.primary} /> : null}
            </View>
            <Text style={[styles.timestamp, { color: theme.secondaryText }]}>
              {post.timestamp} • {post.audience || 'LST community'}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerAction}>
            <AppIcon name="ellipsis-h" size={18} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.contextRow}>
          <AppIcon name={postType === 'Prayer' ? 'heart' : 'users'} solid size={10} color={theme.secondaryText} />
          <Text style={[styles.contextText, { color: theme.secondaryText }]}>{postType}</Text>
        </View>

        <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
        {post.image ? <Image source={{ uri: post.image }} style={styles.image} /> : null}

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.action} onPress={handleLike} accessibilityLabel="Encourage this post">
            <AppIcon name="heart" size={19} color={theme.accent} />
            <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} accessibilityLabel="View comments">
            <AppIcon name="comment" size={19} color={theme.primary} />
            <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} accessibilityLabel="Share post" onPress={handleShare}>
            <AppIcon name="share-alt" size={18} color={theme.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconAction, styles.saveAction]}
            accessibilityLabel={isPostSaved(post.id) ? 'Remove saved post' : 'Save post'}
            onPress={() => toggleSavedPost(post.id)}
          >
            <AppIcon name="bookmark" size={18} color={isPostSaved(post.id) ? theme.accent : theme.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.commentsHeading}>
        <View>
          <Text style={[styles.commentTitle, { color: theme.text }]}>Conversation</Text>
          <Text style={[styles.commentSubtitle, { color: theme.secondaryText }]}>{post.comments.length} responses</Text>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        data={post.comments}
        keyExtractor={item => item.id}
        ListHeaderComponent={<PostContent />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={[styles.commentAvatar, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.initial, { color: theme.primary }]}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.commentBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.commentMeta}>
                <Text style={[styles.commentUser, { color: theme.text }]}>{item.userName}</Text>
                <Text style={[styles.commentTime, { color: theme.secondaryText }]}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>
              <View style={styles.commentActions}>
                <TouchableOpacity><Text style={[styles.replyText, { color: theme.primary }]}>Reply</Text></TouchableOpacity>
                <TouchableOpacity><AppIcon name="heart" size={13} color={theme.secondaryText} /></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="comments" size={28} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start the conversation</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Be the first person to leave an encouraging response.</Text>
          </View>
        }
      />

      <View style={[styles.composer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Image source={{ uri: user?.avatar }} style={styles.composerAvatar} />
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          placeholder="Write an encouraging comment..."
          placeholderTextColor={theme.secondaryText}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: commentText.trim() ? theme.primary : theme.border }]}
          onPress={handleComment}
          disabled={!commentText.trim() || sending}
        >
          <AppIcon name="arrow-up" solid size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24 },
  postCard: { paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  author: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: { fontWeight: '800', fontSize: 16 },
  timestamp: { fontSize: 11, marginTop: 3 },
  headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  contextRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 10 },
  contextText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 17, lineHeight: 28 },
  image: { width: '100%', height: 260, borderRadius: 12, resizeMode: 'cover', marginTop: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, marginTop: 18, paddingTop: 9, gap: 8 },
  action: { minWidth: 48, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionCount: { fontSize: 11, fontWeight: '600' },
  iconAction: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center' },
  saveAction: { marginLeft: 'auto' },
  commentsHeading: { marginTop: 24, marginBottom: 14, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.25)' },
  commentTitle: { fontSize: 19, fontWeight: '800' },
  commentSubtitle: { fontSize: 11, marginTop: 3 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  initial: { fontWeight: '800', fontSize: 13 },
  commentBubble: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentUser: { fontWeight: '800', fontSize: 13 },
  commentText: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  commentTime: { fontSize: 10 },
  commentActions: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 9 },
  replyText: { fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 8 },
  composerAvatar: { width: 34, height: 34, borderRadius: 17, marginBottom: 3 },
  input: { flex: 1, minHeight: 42, maxHeight: 100, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingTop: 11, paddingBottom: 10, fontSize: 13 },
  sendButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
