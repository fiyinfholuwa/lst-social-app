import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import LikersModal from '../../components/LikersModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const youtubeVideoId = value => {
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || null;
    }
    return null;
  } catch { return null; }
};

const playerSource = value => {
  const youtubeId = youtubeVideoId(value);
  return {
    uri: youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&rel=0` : value,
    headers: { Referer: 'https://social.lovestraighttalks.com/' },
  };
};

const SermonCommentCard = ({ comment, isReply = false, theme, navigation, repliesState, onLike, onReply, onLoadReplies, onEdit, onDelete }) => <>
  <View style={[styles.comment, isReply && styles.replyComment, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })}><Avatar uri={comment.userAvatar} size={isReply ? 33 : 39} style={[styles.commentAvatar, { backgroundColor: theme.primarySoft }]} accessibilityLabel={`${comment.userName}'s avatar`} /></TouchableOpacity>
    <View style={styles.commentCopy}>
      <View style={styles.commentHead}><View style={styles.commentIdentity}><TouchableOpacity style={styles.commentNameButton} onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })}><Text numberOfLines={1} style={[styles.commentName, { color: theme.text }]}>{comment.userName}</Text></TouchableOpacity>{comment.mine ? <View style={[styles.youBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.youBadgeText, { color: theme.primary }]}>You</Text></View> : null}</View><Text style={[styles.commentTime, { color: theme.secondaryText }]}>{comment.time}</Text></View>
      <View style={[styles.commentBody, { backgroundColor: theme.background }]}><Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text></View>
      <View style={styles.commentFooter}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.commentAction} onPress={() => onLike(comment, isReply)}><AppIcon name="heart" solid={comment.likedByCurrentUser} size={12} color={comment.likedByCurrentUser ? theme.accent : theme.secondaryText} /><Text style={[styles.actionText, { color: comment.likedByCurrentUser ? theme.accent : theme.secondaryText }]}>{comment.likes || 0}</Text></TouchableOpacity>
          {!isReply && !comment.repliedByCurrentUser ? <TouchableOpacity style={styles.commentAction} onPress={() => onReply(comment)}><AppIcon name="arrow-undo-outline" size={12} color={theme.primary} /><Text style={[styles.actionText, { color: theme.primary }]}>Reply</Text></TouchableOpacity> : null}
          {comment.edited ? <Text style={[styles.editedText, { color: theme.secondaryText }]}>Edited</Text> : null}
        </View>
        {comment.mine ? <View style={styles.actions}><TouchableOpacity style={styles.commentAction} onPress={() => onEdit(comment)}><AppIcon name="create-outline" size={12} color={theme.primary} /><Text style={[styles.actionText, { color: theme.primary }]}>Edit</Text></TouchableOpacity><TouchableOpacity style={styles.commentAction} onPress={() => onDelete(comment, isReply)}><AppIcon name="trash" size={12} color={theme.danger} /><Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text></TouchableOpacity></View> : null}
      </View>
    </View>
  </View>
  {!isReply && comment.repliesCount > 0 ? <TouchableOpacity style={styles.repliesButton} onPress={() => onLoadReplies(comment)}><Text style={[styles.repliesText, { color: theme.primary }]}>{repliesState?.loading ? 'Loading replies…' : repliesState?.data ? 'Hide replies' : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`}</Text></TouchableOpacity> : null}
  {!isReply && repliesState?.data ? repliesState.data.map(reply => <SermonCommentCard key={reply.id} comment={reply} isReply theme={theme} navigation={navigation} onLike={onLike} onEdit={onEdit} onDelete={onDelete} />) : null}
</>;

export default function SermonDetailScreen({ route, navigation }) {
  const { sermonId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sermon, setSermon] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [repliesByParent, setRepliesByParent] = useState({});
  const [editText, setEditText] = useState('');
  const [playerFailed, setPlayerFailed] = useState(false);
  const [likersVisible, setLikersVisible] = useState(false);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const loadSermonLikes = useCallback(page => apiService.getSermonLikes(sermonId, page), [sermonId]);

  const load = async () => {
    try {
      const [sermonData, commentData] = await Promise.all([apiService.getSermon(sermonId), apiService.getSermonComments(sermonId)]);
      setSermon(sermonData); setComments(commentData.data || []); setCommentPage(commentData.currentPage || 1); setHasMoreComments(Boolean(commentData.hasMorePages));
    } catch (error) { Alert.alert('Couldn’t load sermon', error.message || 'Please try again.'); }
  };
  useEffect(() => { load(); }, [sermonId]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      if (Platform.OS !== 'android') return;
      const windowHeight = Dimensions.get('window').height;
      const keyboardTop = event.endCoordinates?.screenY ?? windowHeight;
      setKeyboardOverlap(Math.max(0, windowHeight - keyboardTop));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOverlap(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const loadMoreComments = async () => {
    if (!hasMoreComments || loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const response = await apiService.getSermonComments(sermonId, commentPage + 1);
      setComments(current => {
        const known = new Set(current.map(comment => String(comment.id)));
        return [...current, ...(response.data || []).filter(comment => !known.has(String(comment.id)))];
      });
      setCommentPage(response.currentPage || commentPage + 1);
      setHasMoreComments(Boolean(response.hasMorePages));
    } catch (error) {
      Alert.alert('Couldn’t load more comments', error.message || 'Please try again.');
    } finally { setLoadingMoreComments(false); }
  };

  const toggleLike = async () => {
    try { setSermon(await apiService.likeSermon(sermonId)); } catch (error) { Alert.alert('Like not saved', error.message); }
  };
  const addComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const comment = await apiService.createSermonComment(sermonId, text.trim(), replyTo?.id);
      if (replyTo) {
        const parentId = String(replyTo.id);
        setRepliesByParent(current => ({ ...current, [parentId]: { data: [...(current[parentId]?.data || []), comment], loading: false } }));
        setComments(current => current.map(item => String(item.id) === parentId ? { ...item, repliesCount: (item.repliesCount || 0) + 1, repliedByCurrentUser: true } : item));
      } else setComments(current => [comment, ...current]);
      setText(''); setReplyTo(null); setSermon(current => ({ ...current, commentsCount: current.commentsCount + 1 }));
    } catch (error) { Alert.alert('Comment not posted', error.message); } finally { setSending(false); }
  };
  const loadReplies = async comment => {
    const key = String(comment.id);
    if (repliesByParent[key]?.data) { setRepliesByParent(current => ({ ...current, [key]: undefined })); return; }
    setRepliesByParent(current => ({ ...current, [key]: { loading: true } }));
    try { const response = await apiService.getSermonCommentReplies(sermonId, comment.id); setRepliesByParent(current => ({ ...current, [key]: { loading: false, data: response.data || [] } })); }
    catch (error) { setRepliesByParent(current => ({ ...current, [key]: undefined })); Alert.alert('Couldn’t load replies', error.message); }
  };
  const replaceComment = updated => {
    setComments(current => current.map(item => String(item.id) === String(updated.id) ? updated : item));
    if (updated.parentId) setRepliesByParent(current => ({ ...current, [String(updated.parentId)]: { ...(current[String(updated.parentId)] || {}), data: (current[String(updated.parentId)]?.data || []).map(item => String(item.id) === String(updated.id) ? updated : item) } }));
  };
  const likeComment = async comment => { try { replaceComment(await apiService.likeSermonComment(comment.id)); } catch (error) { Alert.alert('Like not saved', error.message); } };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    try { const updated = await apiService.editSermonComment(editing.id, editText.trim()); replaceComment(updated); setEditing(null); } catch (error) { Alert.alert('Comment not edited', error.message); }
  };
  const deleteComment = comment => Alert.alert('Delete comment?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await apiService.deleteSermonComment(comment.id); if (comment.parentId) { const key = String(comment.parentId); setRepliesByParent(current => ({ ...current, [key]: { ...(current[key] || {}), data: (current[key]?.data || []).filter(item => item.id !== comment.id) } })); setComments(current => current.map(item => String(item.id) === key ? { ...item, repliesCount: Math.max(0, item.repliesCount - 1) } : item)); } else setComments(current => current.filter(item => item.id !== comment.id)); setSermon(current => ({ ...current, commentsCount: Math.max(0, current.commentsCount - (comment.parentId ? 1 : 1 + (comment.repliesCount || 0))) })); } catch (error) { Alert.alert('Comment not deleted', error.message); } } }]);
  const openExternally = async () => {
    try { await Linking.openURL(sermon.url); } catch { Alert.alert('Couldn’t open video', 'No installed app or browser can open this link.'); }
  };

  if (!sermon) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></View>;
  return <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}
      scrollEventThrottle={100}
      onScroll={({ nativeEvent }) => {
        const distanceFromBottom = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
        if (distanceFromBottom < 220) loadMoreComments();
      }}
    >
      <View style={[styles.player, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {playerFailed ? <View style={styles.playerFallback}><AppIcon name="play-circle-outline" size={34} color={theme.primary} /><Text style={[styles.playerFallbackTitle, { color: theme.text }]}>This video can’t play inside the app</Text><Text style={[styles.playerFallbackText, { color: theme.secondaryText }]}>The video provider may have disabled embedded playback.</Text></View> : <WebView source={playerSource(sermon.url)} javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled allowsFullscreenVideo mediaPlaybackRequiresUserAction userAgent="Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36" onError={() => setPlayerFailed(true)} onHttpError={({ nativeEvent }) => nativeEvent.statusCode >= 400 && setPlayerFailed(true)} />}
      </View>
      <View style={[styles.sermonCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {sermon.category?.name ? <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{sermon.category.name}</Text></View> : null}
        <Text style={[styles.title, { color: theme.text }]}>{sermon.title}</Text>
        <View style={styles.speakerRow}><View style={[styles.speakerIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="person-outline" size={13} color={theme.primary} /></View><View><Text style={[styles.speakerLabel, { color: theme.secondaryText }]}>MESSAGE BY</Text><Text style={[styles.meta, { color: theme.text }]}>{sermon.speaker || 'LST Ministry'}</Text></View></View>
        {sermon.description ? <Text style={[styles.description, { color: theme.secondaryText }]}>{sermon.description}</Text> : null}
        <View style={[styles.actionBar, { borderTopColor: theme.border }]}>
          <View style={[styles.actionButton, sermon.likedByCurrentUser && { backgroundColor: theme.primarySoft }]}><TouchableOpacity style={styles.sermonLikeIcon} onPress={toggleLike} accessibilityLabel="Like this sermon"><AppIcon name="heart" solid={sermon.likedByCurrentUser} size={17} color={sermon.likedByCurrentUser ? theme.accent : theme.secondaryText} /></TouchableOpacity><TouchableOpacity onPress={() => sermon.likes > 0 && setLikersVisible(true)} disabled={!sermon.likes} accessibilityLabel={`View ${sermon.likes} people who liked this sermon`}><Text style={[styles.actionButtonText, { color: sermon.likedByCurrentUser ? theme.primary : theme.text }]}>{sermon.likes} {sermon.likes === 1 ? 'like' : 'likes'}</Text></TouchableOpacity></View>
          <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.actionButton} onPress={openExternally}><AppIcon name="play-circle-outline" size={17} color={theme.primary} /><Text style={[styles.actionButtonText, { color: theme.primary }]}>{youtubeVideoId(sermon.url) ? 'YouTube' : 'Open video'}</Text><AppIcon name="arrow-forward" size={12} color={theme.primary} /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.headingRow}><View><Text style={[styles.heading, { color: theme.text }]}>Conversation</Text><Text style={[styles.headingHint, { color: theme.secondaryText }]}>Share what stood out to you</Text></View><View style={[styles.commentCount, { backgroundColor: theme.primarySoft }]}><AppIcon name="comments" size={12} color={theme.primary} /><Text style={[styles.commentCountText, { color: theme.primary }]}>{sermon.commentsCount}</Text></View></View>
      {!comments.length ? <View style={[styles.commentsEmpty, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.commentsEmptyIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="comments" size={24} color={theme.primary} /></View>
        <Text style={[styles.commentsEmptyTitle, { color: theme.text }]}>No comments yet</Text>
        <Text style={[styles.commentsEmptyText, { color: theme.secondaryText }]}>Be the first to share what you learned from this sermon.</Text>
      </View> : null}
      {comments.map(comment => <SermonCommentCard key={comment.id} comment={comment} theme={theme} navigation={navigation} repliesState={repliesByParent[String(comment.id)]} onLike={likeComment} onReply={item => { setReplyTo(item); setText(''); }} onLoadReplies={loadReplies} onEdit={item => { setEditing(item); setEditText(item.text); }} onDelete={deleteComment} />)}
      {loadingMoreComments ? <ActivityIndicator style={styles.commentsLoader} color={theme.primary} /> : null}
    </ScrollView>
    {replyTo ? <View style={[styles.replyingBanner, { backgroundColor: theme.primarySoft, borderTopColor: theme.border }]}><Text style={[styles.replyingText, { color: theme.primary }]}>Replying to {replyTo.userName}</Text><TouchableOpacity onPress={() => setReplyTo(null)}><AppIcon name="times" size={14} color={theme.primary} /></TouchableOpacity></View> : null}
    <View style={[styles.composerDock, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 4, 12), marginBottom: keyboardOverlap }]}><TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: user.id })} accessibilityLabel="View your profile"><Avatar uri={user.avatar} size={36} style={{ backgroundColor: theme.primarySoft }} accessibilityLabel="Your profile picture" /></TouchableOpacity><TextInput value={text} onChangeText={setText} multiline placeholder="Share what you learned…" placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} /><TouchableOpacity style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.border }]} onPress={addComment} disabled={!text.trim() || sending}>{sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppIcon name="paper-plane" size={15} color="#FFFFFF" />}</TouchableOpacity></View>
    <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}><Pressable style={styles.backdrop} onPress={() => setEditing(null)}><Pressable style={[styles.dialog, { backgroundColor: theme.card }]} onPress={() => {}}><Text style={[styles.dialogTitle, { color: theme.text }]}>Edit comment</Text><TextInput autoFocus multiline value={editText} onChangeText={setEditText} style={[styles.editInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} /><View style={styles.dialogActions}><TouchableOpacity style={[styles.dialogButton, { borderColor: theme.border }]} onPress={() => setEditing(null)}><Text style={{ color: theme.text }}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.dialogButton, { backgroundColor: theme.primary }]} onPress={saveEdit}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</Text></TouchableOpacity></View></Pressable></Pressable></Modal>
    <LikersModal visible={likersVisible} onClose={() => setLikersVisible(false)} loadPage={loadSermonLikes} navigation={navigation} title="Sermon likes" />
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  replyComment: { marginLeft: 34, borderTopLeftRadius: 7 },
  repliesButton: { alignSelf: 'flex-start', marginLeft: 58, marginTop: -4, marginBottom: 10, paddingVertical: 4 },
  repliesText: { fontSize: 10, fontWeight: '800' },
  replyingBanner: { minHeight: 36, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyingText: { fontSize: 11, fontWeight: '800' },
  screen: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 14, paddingBottom: 24 }, player: { aspectRatio: 16 / 9, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, playerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }, playerFallbackTitle: { fontSize: 14, fontWeight: '800', marginTop: 9 }, playerFallbackText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 }, sermonCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, marginTop: 10, paddingHorizontal: 15, paddingTop: 15, overflow: 'hidden' }, categoryBadge: { alignSelf: 'flex-start', minHeight: 23, marginBottom: 8, paddingHorizontal: 9, borderRadius: 12, justifyContent: 'center' }, categoryBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: .45, textTransform: 'uppercase' }, title: { fontSize: 20, lineHeight: 26, fontWeight: '900' }, speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 }, speakerIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, speakerLabel: { fontSize: 8, letterSpacing: .8, fontWeight: '900' }, meta: { fontSize: 11, fontWeight: '800', marginTop: 2 }, description: { fontSize: 12, lineHeight: 19, marginTop: 12 }, actionBar: { minHeight: 49, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', marginTop: 14, marginHorizontal: -15 }, actionButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, actionButtonText: { fontSize: 11, fontWeight: '800' }, actionDivider: { width: StyleSheet.hairlineWidth, height: 24 }, headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10, paddingHorizontal: 2 }, heading: { fontSize: 16, fontWeight: '900' }, headingHint: { fontSize: 10, marginTop: 2 }, commentCount: { height: 29, minWidth: 45, paddingHorizontal: 9, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, commentCountText: { fontSize: 10, fontWeight: '900' }, commentsEmpty: { alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingHorizontal: 22, paddingVertical: 25, marginBottom: 9 }, commentsEmptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, commentsEmptyTitle: { fontSize: 14, fontWeight: '800', marginTop: 11 }, commentsEmptyText: { maxWidth: 260, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 }, composerDock: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 9 }, input: { flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, send: { width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, borderWidth: StyleSheet.hairlineWidth, borderRadius: 17, marginBottom: 9 }, commentAvatar: { flexShrink: 0 }, commentCopy: { flex: 1, minWidth: 0 }, commentHead: { minHeight: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, commentIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }, commentNameButton: { flexShrink: 1, minWidth: 0 }, commentName: { fontSize: 12, fontWeight: '800' }, youBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }, youBadgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }, commentTime: { flexShrink: 0, fontSize: 9 }, commentBody: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, marginTop: 5 }, commentText: { fontSize: 12, lineHeight: 18 }, commentFooter: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }, editedText: { fontSize: 8, fontStyle: 'italic' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 11 }, commentAction: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 }, actionText: { fontSize: 9, fontWeight: '800' }, commentsLoader: { paddingVertical: 18 }, backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,.56)', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', borderRadius: 22, padding: 19 }, dialogTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 }, editInput: { minHeight: 110, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' }, dialogActions: { flexDirection: 'row', gap: 9, marginTop: 14 }, dialogButton: { flex: 1, height: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sermonLikeIcon: { minWidth: 28, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
