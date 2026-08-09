import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
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
import Avatar from '../../components/Avatar';
import PostOptionsMenu from '../../components/PostOptionsMenu';
import { useSavedPosts } from '../../context/SavedPostsContext';
import EmojiPicker from '../../components/EmojiPicker';
import EmojiText from '../../components/EmojiText';

const DETAIL_IMAGE_WIDTH = Dimensions.get('window').width - 36;

const CommentText = ({ text, style, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 280;
  return (
    <>
      <EmojiText style={style} numberOfLines={!expanded && long ? 6 : undefined}>{text}</EmojiText>
      {long ? <TouchableOpacity onPress={() => setExpanded(value => !value)}><Text style={[styles.readMoreComment, { color: theme.primary }]}>{expanded ? 'Show less' : 'Read more'}</Text></TouchableOpacity> : null}
    </>
  );
};

const PostSkeleton = ({ theme }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const blockStyle = { backgroundColor: theme.border };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.ScrollView style={{ opacity }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.skeletonAvatar, blockStyle]} />
          <View style={styles.author}>
            <View style={[styles.skeletonAuthor, blockStyle]} />
            <View style={[styles.skeletonTimestamp, blockStyle]} />
          </View>
        </View>
        <View style={[styles.skeletonContext, blockStyle]} />
        <View style={[styles.skeletonContent, blockStyle]} />
        <View style={[styles.skeletonContent, styles.skeletonContentMedium, blockStyle]} />
        <View style={[styles.skeletonContent, styles.skeletonContentShort, blockStyle]} />
        <View style={[styles.skeletonMedia, blockStyle]} />
        <View style={[styles.skeletonActions, { borderTopColor: theme.border }]}>
          {[48, 48, 38, 38].map((width, index) => <View key={index} style={[styles.skeletonAction, { width }, blockStyle]} />)}
        </View>
        <View style={[styles.commentsHeading, { borderTopColor: theme.border }]}>
          <View style={[styles.skeletonCommentTitle, blockStyle]} />
          <View style={[styles.skeletonTimestamp, blockStyle]} />
        </View>
        {[0, 1, 2].map(index => (
          <View key={index} style={[styles.commentRow, index === 2 ? styles.replyRow : null]}>
            <View style={[styles.skeletonCommentAvatar, blockStyle]} />
            <View style={[styles.skeletonCommentBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.skeletonCommentName, blockStyle]} />
              <View style={[styles.skeletonCommentLine, blockStyle]} />
              <View style={[styles.skeletonCommentLineShort, blockStyle]} />
            </View>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

export default function PostScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [repliesByParent, setRepliesByParent] = useState({});
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isPostSaved, toggleSavedPost, forgetDeletedPost } = useSavedPosts();

  useEffect(() => {
    loadPost();
    return navigation.addListener('focus', loadPost);
  }, [navigation, postId]);

  const loadPost = async () => {
    const [postData, commentData] = await Promise.all([apiService.getPost(postId), apiService.getComments(postId, 1)]);
    setPost(postData);
    setComments(commentData.data);
    setCommentPage(commentData.currentPage);
    setHasMoreComments(commentData.hasMorePages);
  };

  const loadMoreComments = async () => {
    if (!hasMoreComments || loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const response = await apiService.getComments(postId, commentPage + 1);
      setComments(current => [...current, ...response.data]);
      setCommentPage(response.currentPage);
      setHasMoreComments(response.hasMorePages);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const loadReplies = async (comment, requestedPage = 1) => {
    const key = String(comment.id);
    setRepliesByParent(current => ({ ...current, [key]: { ...(current[key] || {}), loading: true } }));
    try {
      const response = await apiService.getCommentReplies(postId, comment.id, requestedPage);
      setRepliesByParent(current => ({
        ...current,
        [key]: {
          data: requestedPage === 1 ? response.data : [...(current[key]?.data || []), ...response.data],
          page: response.currentPage,
          hasMore: response.hasMorePages,
          loading: false,
        },
      }));
    } catch (error) {
      setRepliesByParent(current => ({ ...current, [key]: { ...(current[key] || {}), loading: false } }));
    }
  };

  const handleLike = async () => {
    await apiService.likePost(postId);
    loadPost();
  };

  const handleShare = () => navigation.navigate('SharePost', { postId: post.id });

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to comment.');
      return;
    }
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      if (editingComment) await apiService.updateComment(editingComment.id, commentText.trim());
      else await apiService.addComment(postId, commentText.trim(), replyTo?.id || null);
      const parent = replyTo;
      setCommentText('');
      setReplyTo(null);
      setEditingComment(null);
      if (parent) await loadReplies(parent, 1);
      await loadPost();
    } catch (error) {
      Alert.alert(editingComment ? 'Couldn’t update comment' : 'Couldn’t add comment', error.message);
    } finally {
      setSending(false);
    }
  };

  const startReply = comment => {
    setEditingComment(null);
    setReplyTo(comment);
    setTimeout(() => {
      inputRef.current?.focus();
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const startEditComment = comment => {
    setReplyTo(null);
    setEditingComment(comment);
    setCommentText(comment.text);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteComment = comment => Alert.alert(
    'Delete comment?',
    comment.parentId ? 'This reply will be permanently removed.' : 'This comment and its replies will be permanently removed.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteComment(comment.id);
            if (String(editingComment?.id) === String(comment.id)) {
              setEditingComment(null);
              setCommentText('');
            }
            setRepliesByParent({});
            await loadPost();
          } catch (error) {
            Alert.alert('Couldn’t delete comment', error.message);
          }
        },
      },
    ],
  );

  const insertEmoji = emoji => {
    const start = selection.start ?? commentText.length;
    const end = selection.end ?? start;
    setCommentText(`${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`);
    const cursor = start + emoji.length;
    setSelection({ start: cursor, end: cursor });
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const handleCommentLike = async comment => {
    try {
      await apiService.likeComment(comment.id);
      if (comment.parentId) {
        const parent = comments.find(item => String(item.id) === String(comment.parentId));
        if (parent) await loadReplies(parent, 1);
      } else {
        const response = await apiService.getComments(postId, 1);
        setComments(response.data);
        setCommentPage(response.currentPage);
        setHasMoreComments(response.hasMorePages);
      }
    } catch (error) {
      Alert.alert('Couldn’t update comment', error.message);
    }
  };

  const deletePost = async () => {
    try {
      await apiService.deletePost(post.id);
      forgetDeletedPost(post.id);
      navigation.popToTop();
    } catch (error) {
      Alert.alert('Couldn’t delete post', error.message);
      throw error;
    }
  };

  if (!post) return <PostSkeleton theme={theme} />;

  const postType = post.type || (post.communityId ? 'Community' : 'Encouragement');

  const PostContent = () => (
    <>
      <View style={styles.postCard}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: post.userId })}>
            <Avatar uri={post.userAvatar} size={48} style={styles.avatar} accessibilityLabel={`${post.userName}'s profile avatar`} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.author} onPress={() => navigation.navigate('UserProfile', { userId: post.userId })} accessibilityRole="button">
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
              {post.verified ? <AppIcon name="check-circle" solid size={14} color={theme.primary} /> : null}
            </View>
            <Text style={[styles.timestamp, { color: theme.secondaryText }]}>
              {post.timestamp} • {post.audience || 'LST community'}
            </Text>
            {post.status === 'pending' ? <Text style={[styles.pending, { backgroundColor: theme.accentSoft, color: theme.accentDark }]}>Pending approval</Text> : null}
          </TouchableOpacity>
          {String(post.userId) === String(user?.id) ? <PostOptionsMenu onEdit={() => navigation.navigate('EditPost', { postId: post.id })} onDelete={deletePost} /> : null}
        </View>

        <View style={styles.contextRow}>
          <AppIcon name={postType === 'Prayer' ? 'heart' : 'users'} solid size={10} color={theme.secondaryText} />
          <Text style={[styles.contextText, { color: theme.secondaryText }]}>{postType}</Text>
        </View>

        <EmojiText style={[styles.content, { color: theme.text }]}>{post.content}</EmojiText>
        {post.originalPost ? <TouchableOpacity
          style={[styles.sharedOriginal, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.replace('PostDetail', { postId: post.originalPost.id })}
          activeOpacity={0.86}
        >
          <View style={styles.sharedOriginalHeader}>
            <Avatar uri={post.originalPost.userAvatar} size={34} accessibilityLabel={`${post.originalPost.userName}'s profile avatar`} />
            <View style={styles.sharedOriginalCopy}>
              <Text style={[styles.sharedOriginalAuthor, { color: theme.text }]}>{post.originalPost.userName}</Text>
              <Text style={[styles.sharedOriginalMeta, { color: theme.secondaryText }]}>Original post</Text>
            </View>
          </View>
          <EmojiText style={[styles.sharedOriginalText, { color: theme.text }]}>{post.originalPost.content}</EmojiText>
          {(post.originalPost.images?.[0] || post.originalPost.image) ? <Image source={{ uri: post.originalPost.images?.[0] || post.originalPost.image }} style={styles.sharedOriginalImage} /> : null}
        </TouchableOpacity> : null}
        {(post.images?.length ? post.images : post.image ? [post.image] : []).length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {(post.images?.length ? post.images : [post.image]).map((image, index, allImages) => (
              <View key={`${image}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri: image }} style={styles.image} />
                {allImages.length > 1 ? <View style={styles.imageCount}><Text style={styles.imageCountText}>{index + 1}/{allImages.length}</Text></View> : null}
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.action} onPress={handleLike} accessibilityLabel="Encourage this post">
            <AppIcon name="heart" solid={post.likedByCurrentUser} size={19} color={theme.accent} />
            <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} accessibilityLabel="View comments">
            <AppIcon name="comment" size={19} color={theme.primary} />
            <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconAction} accessibilityLabel="Share post" onPress={handleShare}>
            <AppIcon name="share-alt" size={18} color={theme.secondaryText} />
            {post.shareCount ? <Text style={[styles.detailShareCount, { color: theme.secondaryText }]}>{post.shareCount}</Text> : null}
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
          <Text style={[styles.commentSubtitle, { color: theme.secondaryText }]}>{post.commentsCount || 0} responses</Text>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={listRef}
        data={comments}
        keyExtractor={item => item.id}
        ListHeaderComponent={<PostContent />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreComments}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMoreComments ? <ActivityIndicator style={styles.commentsLoader} color={theme.primary} /> : null}
        renderItem={({ item }) => {
          const replyState = repliesByParent[String(item.id)];
          const CommentRow = ({ comment, reply = false }) => <View style={[styles.commentRow, reply && styles.replyRow]}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })} accessibilityRole="button">
              <Avatar uri={comment.userAvatar} size={reply ? 30 : 36} style={styles.commentAvatar} accessibilityLabel={`${comment.userName}'s profile avatar`} />
            </TouchableOpacity>
            <View style={[styles.commentBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.commentMeta}>
                <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })} style={styles.commentAuthor}>
                  <Text numberOfLines={1} style={[styles.commentUser, { color: theme.text }]}>{comment.userName}</Text>
                </TouchableOpacity>
                <Text style={[styles.commentTime, { color: theme.secondaryText }]}>{comment.timestamp}</Text>
              </View>
              <CommentText text={comment.text} style={[styles.commentText, { color: theme.text }]} theme={theme} />
              <View style={styles.commentActions}>
                {!reply && !comment.repliedByCurrentUser ? <TouchableOpacity onPress={() => startReply(item)} accessibilityLabel={`Reply to ${comment.userName}`}><Text style={[styles.replyText, { color: theme.primary }]}>Reply</Text></TouchableOpacity> : null}
                {String(comment.userId) === String(user?.id) ? <>
                  <TouchableOpacity onPress={() => startEditComment(comment)} accessibilityLabel={`Edit your comment`}><Text style={[styles.ownerActionText, { color: theme.secondaryText }]}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteComment(comment)} accessibilityLabel={`Delete your comment`}><Text style={[styles.ownerActionText, { color: theme.danger }]}>Delete</Text></TouchableOpacity>
                </> : null}
                <TouchableOpacity style={styles.commentLike} onPress={() => handleCommentLike(comment)} accessibilityLabel={`Like ${comment.userName}'s comment`}>
                  <AppIcon name="heart" solid={comment.likedByCurrentUser} size={13} color={comment.likedByCurrentUser ? theme.accent : theme.secondaryText} />
                  {comment.likes ? <Text style={[styles.commentLikeCount, { color: theme.secondaryText }]}>{comment.likes}</Text> : null}
                </TouchableOpacity>
              </View>
            </View>
          </View>;
          return <View><CommentRow comment={item} />{replyState?.data?.map(reply => <CommentRow key={reply.id} comment={reply} reply />)}{item.repliesCount > 0 && (!replyState?.data || replyState?.hasMore || replyState?.loading) ? <TouchableOpacity style={styles.repliesButton} onPress={() => loadReplies(item, replyState?.hasMore ? replyState.page + 1 : 1)} disabled={replyState?.loading}><Text style={[styles.repliesText, { color: theme.primary }]}>{replyState?.loading ? 'Loading replies…' : replyState?.hasMore ? 'View more replies' : `View ${item.repliesCount} replies`}</Text></TouchableOpacity> : null}</View>;
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="comments" size={28} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Start the conversation</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Be the first person to leave an encouraging response.</Text>
          </View>
        }
      />

      {showEmojiPicker ? <EmojiPicker theme={theme} onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} /> : null}
      <View style={[styles.composer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Avatar uri={user?.avatar} size={34} style={styles.composerAvatar} accessibilityLabel="Your profile avatar" />
        <View style={styles.inputWrap}>
          {replyTo || editingComment ? <View style={[styles.replyingTo, { backgroundColor: theme.primarySoft }]}><Text style={[styles.replyingText, { color: theme.primary }]}>{editingComment ? 'Editing your comment' : `Replying to ${replyTo.userName}`}</Text><TouchableOpacity onPress={() => { setReplyTo(null); setEditingComment(null); setCommentText(''); }} accessibilityLabel={editingComment ? 'Cancel editing' : 'Cancel reply'}><AppIcon name="times" size={13} color={theme.primary} /></TouchableOpacity></View> : null}
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder={editingComment ? 'Update your comment...' : replyTo ? `Reply to ${replyTo.userName}...` : 'Write an encouraging comment...'}
            placeholderTextColor={theme.secondaryText}
            value={commentText}
            onChangeText={setCommentText}
            onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
            onFocus={() => listRef.current?.scrollToEnd({ animated: true })}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity style={[styles.emojiButton, { backgroundColor: theme.primarySoft }]} onPress={() => { Keyboard.dismiss(); setShowEmojiPicker(true); }} accessibilityLabel="Add emoji">
          <AppIcon name="happy" size={18} color={theme.primary} />
        </TouchableOpacity>
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
  postCard: { paddingBottom: 8, overflow: 'visible' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, position: 'relative', zIndex: 100, elevation: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  skeletonAuthor: { width: 125, height: 14, borderRadius: 7 },
  skeletonTimestamp: { width: 88, height: 9, borderRadius: 5, marginTop: 7 },
  skeletonContext: { width: 80, height: 10, borderRadius: 5, marginBottom: 14 },
  skeletonContent: { width: '100%', height: 13, borderRadius: 7, marginBottom: 9 },
  skeletonContentMedium: { width: '86%' },
  skeletonContentShort: { width: '58%' },
  skeletonMedia: { width: '100%', height: 280, borderRadius: 14, marginTop: 8 },
  skeletonActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 18, paddingTop: 14 },
  skeletonAction: { height: 20, borderRadius: 10 },
  skeletonCommentTitle: { width: 130, height: 16, borderRadius: 8 },
  skeletonCommentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 9 },
  skeletonCommentBubble: { flex: 1, height: 84, borderWidth: 1, borderRadius: 16, padding: 12 },
  skeletonCommentName: { width: '38%', height: 10, borderRadius: 5 },
  skeletonCommentLine: { width: '92%', height: 9, borderRadius: 5, marginTop: 12 },
  skeletonCommentLineShort: { width: '62%', height: 9, borderRadius: 5, marginTop: 7 },
  author: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: { fontWeight: '700', fontSize: 16 },
  timestamp: { fontSize: 11, marginTop: 3 },
  pending: { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', fontSize: 9, fontWeight: '800' },
  headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  contextRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 10, zIndex: 0 },
  contextText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 17, lineHeight: 28, zIndex: 0 },
  sharedOriginal: { borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 15 },
  sharedOriginalHeader: { flexDirection: 'row', alignItems: 'center' },
  sharedOriginalCopy: { flex: 1, marginLeft: 9 },
  sharedOriginalAuthor: { fontSize: 13, fontWeight: '800' },
  sharedOriginalMeta: { fontSize: 10, marginTop: 2 },
  sharedOriginalText: { fontSize: 14, lineHeight: 21, marginTop: 11 },
  sharedOriginalImage: { width: '100%', height: 220, borderRadius: 12, resizeMode: 'cover', marginTop: 11 },
  gallery: { marginTop: 16, borderRadius: 14 },
  imageWrap: { width: DETAIL_IMAGE_WIDTH, height: 280, marginRight: 8 },
  image: { width: '100%', height: '100%', borderRadius: 14, resizeMode: 'cover' },
  imageCount: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(31,18,25,0.72)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  imageCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, marginTop: 18, paddingTop: 9 },
  action: { minWidth: 48, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionCount: { fontSize: 11, fontWeight: '600' },
  iconAction: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center' },
  detailShareCount: { position: 'absolute', right: 0, top: 0, fontSize: 9, fontWeight: '800' },
  saveAction: { marginLeft: 'auto' },
  commentsHeading: { marginTop: 24, marginBottom: 14, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.25)' },
  commentTitle: { fontSize: 19, fontWeight: '700' },
  commentSubtitle: { fontSize: 11, marginTop: 3 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  replyRow: { marginLeft: 32, marginBottom: 10 },
  commentAvatar: { flexShrink: 0 },
  commentBubble: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { flex: 1, marginRight: 10 },
  commentUser: { fontWeight: '700', fontSize: 13 },
  commentText: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  readMoreComment: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', marginTop: 5 },
  commentTime: { fontSize: 11 },
  commentActions: { flexDirection: 'row', gap: 18, alignItems: 'center', marginTop: 8 },
  commentLike: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeCount: { fontSize: 11, fontWeight: '600' },
  replyText: { fontSize: 11, fontWeight: '700' },
  ownerActionText: { fontSize: 11, fontWeight: '700' },
  repliesButton: { marginLeft: 46, marginTop: -3, marginBottom: 13, paddingVertical: 3, alignSelf: 'flex-start' },
  repliesText: { fontSize: 11, fontWeight: '800' },
  commentsLoader: { paddingVertical: 18 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10, gap: 7 },
  composerAvatar: { width: 34, height: 34, borderRadius: 17, marginBottom: 3 },
  inputWrap: { flex: 1 },
  replyingTo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 5 },
  replyingText: { fontSize: 11, fontWeight: '700' },
  input: { flex: 1, minHeight: 42, maxHeight: 100, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingTop: 11, paddingBottom: 10, fontSize: 13 },
  emojiButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
