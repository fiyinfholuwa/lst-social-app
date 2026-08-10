import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Loader from '../../components/Loader';
import EmojiPicker from '../../components/EmojiPicker';
import { useTheme } from '../../context/ThemeContext';

const MAX_IMAGES = 6;
const uniqueImages = images => images.filter((image, index, list) => list.findIndex(item => item.uri === image.uri) === index);

export default function EditPostScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    apiService.getPost(postId).then(data => {
      setPost(data);
      setContent(data.content);
      setImages(uniqueImages((data.images?.length ? data.images : data.image ? [data.image] : []).map(uri => ({ uri, existing: true }))));
    }).catch(error => Alert.alert('Couldn’t load post', error.message));
  }, [postId]);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Photo limit reached', `You can add up to ${MAX_IMAGES} photos to one post.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings to add pictures to your post.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.82,
    });

    if (result.canceled) return;

    setProcessingImages(true);
    try {
      const optimized = await Promise.all(result.assets.map(async (asset, index) => {
        const largestSide = Math.max(asset.width || 0, asset.height || 0);
        const resize = largestSide > 1200
          ? asset.width >= asset.height ? { width: 1200 } : { height: 1200 }
          : null;
        let output = await ImageManipulator.manipulateAsync(
          asset.uri,
          resize ? [{ resize }] : [],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
        );
        const fileInfo = await FileSystem.getInfoAsync(output.uri, { size: true });
        if (fileInfo.exists && fileInfo.size > 900000) {
          output = await ImageManipulator.manipulateAsync(
            output.uri,
            [{ resize: output.width >= output.height ? { width: 900 } : { height: 900 } }],
            { compress: 0.38, format: ImageManipulator.SaveFormat.JPEG },
          );
        }
        return { ...output, existing: false, fileName: `lst-post-${Date.now()}-${index + 1}.jpg`, mimeType: 'image/jpeg' };
      }));
      setImages(current => uniqueImages([...current, ...optimized]).slice(0, MAX_IMAGES));
    } catch (error) {
      Alert.alert('Couldn’t prepare photos', 'Please try selecting the photos again.');
    } finally {
      setProcessingImages(false);
    }
  };

  const removeImage = uri => setImages(current => current.filter(image => image.uri !== uri));

  const insertEmoji = emoji => {
    const start = selection.start ?? content.length;
    const end = selection.end ?? start;
    setContent(`${content.slice(0, start)}${emoji}${content.slice(end)}`);
    const cursor = start + emoji.length;
    setSelection({ start: cursor, end: cursor });
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const save = async () => {
    if (!content.trim()) {
      Alert.alert('Post cannot be empty', 'Write something before saving.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await apiService.updatePost(postId, content.trim(), images);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Couldn’t update post', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!post) return <Loader />;
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
      <Text style={[styles.title, { color: theme.text }]}>Update your conversation.</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Update your words and photos before sharing the changes.</Text>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          value={content}
          onChangeText={setContent}
          onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
          multiline
          maxLength={10000}
          autoFocus
        />
        <TouchableOpacity style={[styles.emojiButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowEmojiPicker(value => !value)} accessibilityLabel="Add emoji">
          <View style={styles.emojiButtonContent}><AppIcon name="happy" size={18} color={theme.primary} /><Text style={[styles.emojiButtonText, { color: theme.primary }]}>Add emoji</Text></View>
        </TouchableOpacity>
        {showEmojiPicker ? <EmojiPicker theme={theme} onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} /> : null}
        {images.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(image.uri)} accessibilityLabel={`Remove photo ${index + 1}`}>
                <AppIcon name="times" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES ? <TouchableOpacity style={[styles.addImage, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]} onPress={pickImages} disabled={processingImages}>
            {processingImages ? <ActivityIndicator color={theme.accent} /> : <AppIcon name="add" size={24} color={theme.accent} />}
            <Text style={[styles.addImageText, { color: theme.accent }]}>Add photo</Text>
          </TouchableOpacity> : null}
        </ScrollView> : null}
        {!images.length ? <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.accentSoft }]} onPress={pickImages} disabled={processingImages}>
          {processingImages ? <ActivityIndicator color={theme.accent} /> : <AppIcon name="images-outline" size={20} color={theme.accent} />}
          <Text style={[styles.photoButtonText, { color: theme.accent }]}>{processingImages ? 'Preparing…' : 'Add photos'}</Text>
        </TouchableOpacity> : null}
        <View style={[styles.note, { borderTopColor: theme.border }]}>
          <AppIcon name="information-circle-outline" size={16} color={theme.secondaryText} />
          <Text style={[styles.noteText, { color: theme.secondaryText }]}>{images.length}/{MAX_IMAGES} photos attached.</Text>
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
  title: { fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16 },
  input: { minHeight: 190, fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
  images: { gap: 9, paddingVertical: 14 },
  imageWrap: { width: 112, height: 112 },
  image: { width: '100%', height: '100%', borderRadius: 14 },
  emojiButton: { alignSelf: 'flex-start', paddingHorizontal: 13, minHeight: 40, borderRadius: 12, justifyContent: 'center', marginBottom: 2 },
  emojiButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emojiButtonText: { fontSize: 13, fontWeight: '700' },
  removeImage: { position: 'absolute', top: 6, right: 6, width: 27, height: 27, borderRadius: 14, backgroundColor: 'rgba(31,18,25,0.78)', alignItems: 'center', justifyContent: 'center' },
  addImage: { width: 112, height: 112, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addImageText: { fontSize: 11, fontWeight: '800' },
  photoButton: { minHeight: 44, paddingHorizontal: 14, alignSelf: 'flex-start', borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 14 },
  photoButtonText: { fontSize: 13, fontWeight: '800' },
  note: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  noteText: { fontSize: 12 },
  button: { height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
