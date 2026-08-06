import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import { useTheme } from '../../context/ThemeContext';

export default function EditPostScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    apiService.getPost(postId).then(data => {
      setPost(data);
      setContent(data.content);
    }).catch(error => Alert.alert('Couldn’t load post', error.message));
  }, [postId]);

  const save = async () => {
    if (!content.trim()) {
      Alert.alert('Post cannot be empty', 'Write something before saving.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await apiService.updatePost(postId, content.trim());
      navigation.goBack();
    } catch (error) {
      Alert.alert('Couldn’t update post', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!post) return <Loader />;
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.eyebrow, { color: theme.accent }]}>EDIT POST</Text>
      <Text style={[styles.title, { color: theme.text }]}>Update your conversation.</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Your existing photos will remain attached.</Text>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={10000}
          autoFocus
        />
        {images.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
          {images.map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.image} />)}
        </ScrollView> : null}
        <View style={[styles.note, { borderTopColor: theme.border }]}>
          <AppIcon name="information-circle-outline" size={16} color={theme.secondaryText} />
          <Text style={[styles.noteText, { color: theme.secondaryText }]}>Editing changes the text only.</Text>
        </View>
      </View>

      <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.86}>
        <LinearGradient colors={[theme.primary, theme.accentDark]} style={styles.button}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>Save changes</Text><AppIcon name="check" size={17} color="#FFFFFF" /></>}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 26, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.7 },
  title: { fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16 },
  input: { minHeight: 190, fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
  images: { gap: 9, paddingVertical: 14 },
  image: { width: 112, height: 112, borderRadius: 14 },
  note: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  noteText: { fontSize: 12 },
  button: { height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
