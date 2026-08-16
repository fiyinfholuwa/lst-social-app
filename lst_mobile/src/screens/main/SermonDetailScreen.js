import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import { useTheme } from '../../context/ThemeContext';

const playableUrl = value => {
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return value;
  } catch { return value; }
};

export default function SermonDetailScreen({ route }) {
  const { sermonId } = route.params;
  const { theme } = useTheme();
  const [sermon, setSermon] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');

  const load = async () => {
    try {
      const [sermonData, commentData] = await Promise.all([apiService.getSermon(sermonId), apiService.getSermonComments(sermonId)]);
      setSermon(sermonData); setComments(commentData.data || []);
    } catch (error) { Alert.alert('Couldn’t load sermon', error.message || 'Please try again.'); }
  };
  useEffect(() => { load(); }, [sermonId]);

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

  if (!sermon) return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></View>;
  return <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={[styles.player, { backgroundColor: theme.card }]}><WebView source={{ uri: playableUrl(sermon.url) }} javaScriptEnabled allowsFullscreenVideo mediaPlaybackRequiresUserAction /></View>
      <Text style={[styles.title, { color: theme.text }]}>{sermon.title}</Text>
      <Text style={[styles.meta, { color: theme.primary }]}>{[sermon.category?.name, sermon.speaker].filter(Boolean).join(' · ')}</Text>
      {sermon.description ? <Text style={[styles.description, { color: theme.secondaryText }]}>{sermon.description}</Text> : null}
      <TouchableOpacity style={[styles.like, { backgroundColor: sermon.likedByCurrentUser ? theme.primarySoft : theme.card, borderColor: sermon.likedByCurrentUser ? theme.primary : theme.border }]} onPress={toggleLike}><AppIcon name="heart" solid={sermon.likedByCurrentUser} size={18} color={sermon.likedByCurrentUser ? theme.accent : theme.secondaryText} /><Text style={[styles.likeText, { color: theme.text }]}>{sermon.likes} like{sermon.likes === 1 ? '' : 's'}</Text></TouchableOpacity>
      <Text style={[styles.heading, { color: theme.text }]}>Comments ({sermon.commentsCount})</Text>
      <View style={styles.composer}><TextInput value={text} onChangeText={setText} multiline placeholder="Share what you learned…" placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} /><TouchableOpacity style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.border }]} onPress={addComment} disabled={!text.trim() || sending}>{sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <AppIcon name="paper-plane" size={15} color="#FFFFFF" />}</TouchableOpacity></View>
      {comments.map(comment => <View key={comment.id} style={[styles.comment, { backgroundColor: theme.card, borderColor: theme.border }]}><Avatar uri={comment.userAvatar} size={35} /><View style={styles.commentCopy}><View style={styles.commentHead}><Text style={[styles.commentName, { color: theme.text }]}>{comment.userName}</Text><Text style={[styles.commentTime, { color: theme.secondaryText }]}>{comment.edited ? 'edited · ' : ''}{comment.time}</Text></View><Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text>{comment.mine ? <View style={styles.actions}><TouchableOpacity onPress={() => { setEditing(comment); setEditText(comment.text); }}><Text style={[styles.actionText, { color: theme.primary }]}>Edit</Text></TouchableOpacity><TouchableOpacity onPress={() => deleteComment(comment)}><Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text></TouchableOpacity></View> : null}</View></View>)}
    </ScrollView>
    <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}><Pressable style={styles.backdrop} onPress={() => setEditing(null)}><Pressable style={[styles.dialog, { backgroundColor: theme.card }]} onPress={() => {}}><Text style={[styles.dialogTitle, { color: theme.text }]}>Edit comment</Text><TextInput autoFocus multiline value={editText} onChangeText={setEditText} style={[styles.editInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} /><View style={styles.dialogActions}><TouchableOpacity style={[styles.dialogButton, { borderColor: theme.border }]} onPress={() => setEditing(null)}><Text style={{ color: theme.text }}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.dialogButton, { backgroundColor: theme.primary }]} onPress={saveEdit}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</Text></TouchableOpacity></View></Pressable></Pressable></Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 14, paddingBottom: 60 }, player: { height: 210, borderRadius: 17, overflow: 'hidden' }, title: { fontSize: 21, lineHeight: 28, fontWeight: '800', marginTop: 16 }, meta: { fontSize: 11, fontWeight: '800', marginTop: 5 }, description: { fontSize: 12, lineHeight: 19, marginTop: 10 }, like: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 13, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, likeText: { fontSize: 12, fontWeight: '800' }, heading: { fontSize: 16, fontWeight: '800', marginTop: 24, marginBottom: 10 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 }, input: { flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderRadius: 15, padding: 12, fontSize: 13 }, send: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, comment: { flexDirection: 'row', gap: 10, padding: 12, borderWidth: 1, borderRadius: 15, marginBottom: 8 }, commentCopy: { flex: 1 }, commentHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, commentName: { flex: 1, fontSize: 12, fontWeight: '800' }, commentTime: { fontSize: 9 }, commentText: { fontSize: 12, lineHeight: 18, marginTop: 4 }, actions: { flexDirection: 'row', gap: 14, marginTop: 8 }, actionText: { fontSize: 10, fontWeight: '800' }, backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,.56)', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', borderRadius: 22, padding: 19 }, dialogTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 }, editInput: { minHeight: 110, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' }, dialogActions: { flexDirection: 'row', gap: 9, marginTop: 14 }, dialogButton: { flex: 1, height: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
