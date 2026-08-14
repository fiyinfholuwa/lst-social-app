import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import EmojiText from '../../components/EmojiText';
import Loader from '../../components/Loader';
import KeyboardSafeView from '../../components/KeyboardSafeView';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { copyPostLink, sharePostLink } from '../../utils/postLinks';

export default function SharePostScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    apiService.getPost(postId)
      .then(data => setPost(data.originalPost || data))
      .catch(error => Alert.alert('Couldn’t load post', error.message, [{ text: 'Go back', onPress: navigation.goBack }]));
  }, [navigation, postId]);

  const submit = async () => {
    if (submitting) return;
    if (!user?.emailVerified) {
      Alert.alert('Verify your email', 'Verify your email before sharing a post to your timeline.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Verify email', onPress: () => navigation.navigate('MainTabs', { screen: 'Profile' }) },
      ]);
      return;
    }
    setSubmitting(true);
    try {
      await apiService.sharePost(postId, note.trim());
      Alert.alert('Shared with your friends', 'The post is now visible to your friends as one of your posts.', [
        { text: 'Done', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      Alert.alert('Couldn’t share post', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => copyPostLink(postId);
  const shareLink = () => sharePostLink(postId);

  if (!post) return <Loader />;
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];

  return (
    <KeyboardSafeView style={{ backgroundColor: theme.background }}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.intro}>
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><AppIcon name="share-alt" size={20} color={theme.primary} /></View>
        <View style={styles.introCopy}>
          <Text style={[styles.title, { color: theme.text }]}>Share with your friends</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Add a note, or share the post with your friends as it is.</Text>
        </View>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={5000}
        placeholder="What would you like to say? (optional)"
        placeholderTextColor={theme.secondaryText}
        style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        textAlignVertical="top"
      />
      <Text style={[styles.counter, { color: theme.secondaryText }]}>{note.length}/5000</Text>

      <View style={[styles.original, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.authorRow}>
          <Avatar uri={post.userAvatar} size={40} accessibilityLabel={`${post.userName}'s profile avatar`} />
          <View style={styles.authorCopy}>
            <Text style={[styles.author, { color: theme.text }]}>{post.userName}</Text>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>{post.timestamp} · Original post</Text>
          </View>
        </View>
        <EmojiText style={[styles.postText, { color: theme.text }]}>{post.content}</EmojiText>
        {images[0] ? <Image source={{ uri: images[0] }} style={styles.image} /> : null}
      </View>

      <View style={styles.linkActions}>
        <TouchableOpacity style={[styles.linkButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={copyLink} accessibilityRole="button">
          <AppIcon name="copy-outline" size={17} color={theme.primary} />
          <Text style={[styles.linkButtonText, { color: theme.text }]}>Copy link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={shareLink} accessibilityRole="button">
          <AppIcon name="share-outline" size={17} color={theme.primary} />
          <Text style={[styles.linkButtonText, { color: theme.text }]}>Share link</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={submit} disabled={submitting} accessibilityRole="button">
        {submitting ? <ActivityIndicator color="#FFFFFF" /> : <><AppIcon name="share-alt" size={16} color="#FFFFFF" /><Text style={styles.buttonText}>Share to my timeline</Text></>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  introCopy: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  note: { minHeight: 112, borderWidth: 1, borderRadius: 17, padding: 14, fontSize: 14, lineHeight: 21 },
  counter: { alignSelf: 'flex-end', fontSize: 10, marginTop: 5, marginRight: 3 },
  original: { borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 15 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorCopy: { flex: 1, marginLeft: 10 },
  author: { fontSize: 14, fontWeight: '800' },
  meta: { fontSize: 10, marginTop: 3 },
  postText: { fontSize: 14, lineHeight: 22, marginTop: 13 },
  image: { width: '100%', height: 210, borderRadius: 13, resizeMode: 'cover', marginTop: 13 },
  linkActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  linkButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  linkButtonText: { fontSize: 12, fontWeight: '800' },
  button: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
