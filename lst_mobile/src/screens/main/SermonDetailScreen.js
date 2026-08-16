import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
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
  const [editText, setEditText] = useState('');
  const [playerFailed, setPlayerFailed] = useState(false);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);

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
    try { const comment = await apiService.createSermonComment(sermonId, text.trim()); setComments(current => [comment, ...current]); setText(''); setSermon(current => ({ ...current, commentsCount: current.commentsCount + 1 })); } catch (error) { Alert.alert('Comment not posted', error.message); } finally { setSending(false); }
  };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    try { const updated = await apiService.editSermonComment(editing.id, editText.trim()); setComments(current => current.map(item => item.id === updated.id ? updated : item)); setEditing(null); } catch (error) { Alert.alert('Comment not edited', error.message); }
  };
  const deleteComment = comment => Alert.alert('Delete comment?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await apiService.deleteSermonComment(comment.id); setComments(current => current.filter(item => item.id !== comment.id)); setSermon(current => ({ ...current, commentsCount: Math.max(0, current.commentsCount - 1) })); } catch (error) { Alert.alert('Comment not deleted', error.message); } } }]);
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
      <View style={[styles.player, { backgroundColor: theme.card }]}>
        {playerFailed ? <View style={styles.playerFallback}><AppIcon name="play-circle-outline" size={34} color={theme.primary} /><Text style={[styles.playerFallbackTitle, { color: theme.text }]}>This video can’t play inside the app</Text><Text style={[styles.playerFallbackText, { color: theme.secondaryText }]}>The video provider may have disabled embedded playback.</Text></View> : <WebView source={playerSource(sermon.url)} javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled allowsFullscreenVideo mediaPlaybackRequiresUserAction userAgent="Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36" onError={() => setPlayerFailed(true)} onHttpError={({ nativeEvent }) => nativeEvent.statusCode >= 400 && setPlayerFailed(true)} />}
      </View>
      <TouchableOpacity style={[styles.externalButton, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={openExternally}><AppIcon name="play-circle-outline" size={16} color={theme.primary} /><Text style={[styles.externalText, { color: theme.primary }]}>{youtubeVideoId(sermon.url) ? 'Open in YouTube' : 'Open in browser'}</Text><AppIcon name="arrow-forward" size={14} color={theme.primary} /></TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>{sermon.title}</Text>
      <Text style={[styles.meta, { color: theme.primary }]}>{[sermon.category?.name, sermon.speaker].filter(Boolean).join(' · ')}</Text>
      {sermon.description ? <Text style={[styles.description, { color: theme.secondaryText }]}>{sermon.description}</Text> : null}
      <TouchableOpacity style={[styles.like, { backgroundColor: sermon.likedByCurrentUser ? theme.primarySoft : theme.card, borderColor: sermon.likedByCurrentUser ? theme.primary : theme.border }]} onPress={toggleLike}><AppIcon name="heart" solid={sermon.likedByCurrentUser} size={18} color={sermon.likedByCurrentUser ? theme.accent : theme.secondaryText} /><Text style={[styles.likeText, { color: theme.text }]}>{sermon.likes} like{sermon.likes === 1 ? '' : 's'}</Text></TouchableOpacity>
      <Text style={[styles.heading, { color: theme.text }]}>Comments ({sermon.commentsCount})</Text>
      {comments.map(comment => <View key={comment.id} style={[styles.comment, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })} accessibilityRole="button" accessibilityLabel={`View ${comment.userName}'s profile`}>
          <Avatar uri={comment.userAvatar} size={39} style={[styles.commentAvatar, { backgroundColor: theme.primarySoft }]} accessibilityLabel={`${comment.userName}'s avatar`} />
        </TouchableOpacity>
        <View style={styles.commentCopy}>
          <View style={styles.commentHead}>
            <View style={styles.commentIdentity}><TouchableOpacity style={styles.commentNameButton} onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })}><Text numberOfLines={1} style={[styles.commentName, { color: theme.text }]}>{comment.userName}</Text></TouchableOpacity>{comment.mine ? <View style={[styles.youBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.youBadgeText, { color: theme.primary }]}>You</Text></View> : null}</View>
            <Text style={[styles.commentTime, { color: theme.secondaryText }]}>{comment.time}</Text>
          </View>
          <View style={[styles.commentBody, { backgroundColor: theme.background }]}><Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text></View>
          <View style={styles.commentFooter}>{comment.edited ? <Text style={[styles.editedText, { color: theme.secondaryText }]}>Edited</Text> : <View />}{comment.mine ? <View style={styles.actions}><TouchableOpacity style={styles.commentAction} onPress={() => { setEditing(comment); setEditText(comment.text); }}><AppIcon name="create-outline" size={12} color={theme.primary} /><Text style={[styles.actionText, { color: theme.primary }]}>Edit</Text></TouchableOpacity><TouchableOpacity style={styles.commentAction} onPress={() => deleteComment(comment)}><AppIcon name="trash" size={12} color={theme.danger} /><Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text></TouchableOpacity></View> : null}</View>
        </View>
      </View>)}
      {loadingMoreComments ? <ActivityIndicator style={styles.commentsLoader} color={theme.primary} /> : null}
    </ScrollView>
    <View style={[styles.composerDock, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom + 4, 12), marginBottom: keyboardOverlap }]}><TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: user.id })} accessibilityLabel="View your profile"><Avatar uri={user.avatar} size={36} style={{ backgroundColor: theme.primarySoft }} accessibilityLabel="Your profile picture" /></TouchableOpacity><TextInput value={text} onChangeText={setText} multiline placeholder="Share what you learned…" placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} /><TouchableOpacity style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.border }]} onPress={addComment} disabled={!text.trim() || sending}>{sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppIcon name="paper-plane" size={15} color="#FFFFFF" />}</TouchableOpacity></View>
    <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}><Pressable style={styles.backdrop} onPress={() => setEditing(null)}><Pressable style={[styles.dialog, { backgroundColor: theme.card }]} onPress={() => {}}><Text style={[styles.dialogTitle, { color: theme.text }]}>Edit comment</Text><TextInput autoFocus multiline value={editText} onChangeText={setEditText} style={[styles.editInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} /><View style={styles.dialogActions}><TouchableOpacity style={[styles.dialogButton, { borderColor: theme.border }]} onPress={() => setEditing(null)}><Text style={{ color: theme.text }}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.dialogButton, { backgroundColor: theme.primary }]} onPress={saveEdit}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</Text></TouchableOpacity></View></Pressable></Pressable></Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 14, paddingBottom: 24 }, player: { height: 210, borderRadius: 17, overflow: 'hidden' }, playerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }, playerFallbackTitle: { fontSize: 14, fontWeight: '800', marginTop: 9 }, playerFallbackText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 }, externalButton: { height: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8 }, externalText: { fontSize: 11, fontWeight: '800' }, title: { fontSize: 21, lineHeight: 28, fontWeight: '800', marginTop: 16 }, meta: { fontSize: 11, fontWeight: '800', marginTop: 5 }, description: { fontSize: 12, lineHeight: 19, marginTop: 10 }, like: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 13, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, likeText: { fontSize: 12, fontWeight: '800' }, heading: { fontSize: 16, fontWeight: '800', marginTop: 24, marginBottom: 10 }, composerDock: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 9 }, input: { flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderRadius: 15, padding: 12, fontSize: 13 }, send: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, borderWidth: 1, borderRadius: 17, marginBottom: 9 }, commentAvatar: { flexShrink: 0 }, commentCopy: { flex: 1, minWidth: 0 }, commentHead: { minHeight: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, commentIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }, commentNameButton: { flexShrink: 1, minWidth: 0 }, commentName: { fontSize: 12, fontWeight: '800' }, youBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }, youBadgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }, commentTime: { flexShrink: 0, fontSize: 9 }, commentBody: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, marginTop: 5 }, commentText: { fontSize: 12, lineHeight: 18 }, commentFooter: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }, editedText: { fontSize: 8, fontStyle: 'italic' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 11 }, commentAction: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 }, actionText: { fontSize: 9, fontWeight: '800' }, commentsLoader: { paddingVertical: 18 }, backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,.56)', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', borderRadius: 22, padding: 19 }, dialogTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 }, editInput: { minHeight: 110, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' }, dialogActions: { flexDirection: 'row', gap: 9, marginTop: 14 }, dialogButton: { flex: 1, height: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
