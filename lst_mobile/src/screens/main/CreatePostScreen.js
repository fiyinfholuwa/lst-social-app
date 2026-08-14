import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import Icon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import EmojiPicker from '../../components/EmojiPicker';
import KeyboardSafeView from '../../components/KeyboardSafeView';

const MAX_IMAGES = 6;

export default function CreatePostScreen({ navigation, route }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const communityId = route?.params?.communityId;
  const communityName = route?.params?.communityName;

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

    if (!result.canceled) {
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
            const secondResize = output.width >= output.height ? { width: 900 } : { height: 900 };
            output = await ImageManipulator.manipulateAsync(
              output.uri,
              [{ resize: secondResize }],
              { compress: 0.38, format: ImageManipulator.SaveFormat.JPEG },
            );
          }

          return {
            ...output,
            fileName: `lst-post-${Date.now()}-${index + 1}.jpg`,
            mimeType: 'image/jpeg',
          };
        }));
        setImages(current => [...current, ...optimized].slice(0, MAX_IMAGES));
      } catch (error) {
        Alert.alert('Couldn’t prepare photos', 'Please try selecting the photos again.');
      } finally {
        setProcessingImages(false);
      }
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

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Write something', 'Add a message before sharing your post.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication required', 'Please sign in before sharing a post.');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (communityId) {
        await apiService.createCommunityPost(communityId, content.trim(), images);
      } else {
        await apiService.createPost(content.trim(), images);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Couldn’t share post', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardSafeView style={{ backgroundColor: theme.background }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
      <Text style={[styles.eyebrow, { color: theme.accent }]}>{communityId ? 'COMMUNITY POST' : 'CREATE A POST'}</Text>
      <Text style={[styles.heading, { color: theme.text }]}>Share what’s on your heart.</Text>
      <Text style={[styles.subheading, { color: theme.secondaryText }]}>{communityId ? `Community posts stay inside ${communityName || 'this community'}. Member posts are reviewed before appearing.` : ['admin', 'super_admin'].includes(user?.role) ? 'Your administrator post will be visible to everyone.' : 'Your post will be visible to your friends.'}</Text>

      <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.authorRow}>
          <Avatar uri={user?.avatar} size={44} style={styles.avatar} accessibilityLabel="Your profile avatar" />
          <View>
            <Text style={[styles.authorName, { color: theme.text }]}>{user?.name || 'LST member'}</Text>
            <View style={styles.audience}><Icon name="people-outline" size={12} color={theme.secondaryText} /><Text style={[styles.audienceText, { color: theme.secondaryText }]}>{communityName || 'Everyone'}</Text></View>
          </View>
        </View>

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          placeholder="Start a conversation..."
          placeholderTextColor={theme.secondaryText}
          multiline
          value={content}
          onChangeText={setContent}
          onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
          maxLength={10000}
          autoFocus
        />

        {showEmojiPicker ? <EmojiPicker theme={theme} onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} /> : null}

        {images.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.previewWrap}>
                <Image source={{ uri: image.uri }} style={styles.preview} />
                <TouchableOpacity style={styles.remove} onPress={() => removeImage(image.uri)} accessibilityLabel={`Remove photo ${index + 1}`}>
                  <Icon name="times" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <TouchableOpacity
                style={[styles.addMoreTile, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
                onPress={pickImages}
                disabled={processingImages}
              >
                {processingImages ? <ActivityIndicator color={theme.accent} /> : <Icon name="add" size={24} color={theme.accent} />}
                <Text style={[styles.addMoreText, { color: theme.accent }]}>Add more</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ) : null}

        <View style={[styles.composerFooter, { borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.accentSoft }]} onPress={pickImages} disabled={processingImages}>
            {processingImages ? <ActivityIndicator size="small" color={theme.accent} /> : <Icon name="images-outline" size={20} color={theme.accent} />}
            <Text style={[styles.photoText, { color: theme.accent }]}>{processingImages ? 'Preparing…' : images.length ? 'Add more photos' : 'Add photos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.emojiButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowEmojiPicker(value => !value)} accessibilityLabel="Add emoji">
            <Icon name="happy" size={21} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.photoCount, { color: theme.secondaryText }]}>{images.length}/{MAX_IMAGES}</Text>
        </View>
      </View>

      <View style={[styles.note, { backgroundColor: theme.primarySoft }]}>
        <Icon name="shield-checkmark-outline" size={18} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.primary }]}>Lead with kindness and respect. Love Straight Talks is a safe space for genuine conversations.</Text>
      </View>

      <TouchableOpacity activeOpacity={0.86} onPress={handleSubmit} disabled={submitting}>
        <LinearGradient colors={[theme.primary, theme.accentDark]} style={styles.button}>
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>{communityId ? 'Submit for approval' : 'Share post'}</Text><Icon name="paper-plane" size={17} color="#FFFFFF" /></>}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingTop: 24, paddingBottom: 44 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 8 },
  heading: { fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  subheading: { fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 21 },
  composer: { borderWidth: 1, borderRadius: 24, padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 11 },
  authorName: { fontSize: 14, fontWeight: '800' },
  audience: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  audienceText: { fontSize: 11, fontWeight: '600' },
  input: { minHeight: 170, paddingVertical: 20, fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
  previewRow: { gap: 10, paddingBottom: 16 },
  previewWrap: { width: 132, height: 132 },
  preview: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
  remove: { position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(31,18,25,0.78)', alignItems: 'center', justifyContent: 'center' },
  addMoreTile: { width: 132, height: 132, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 7 },
  addMoreText: { fontSize: 12, fontWeight: '800' },
  composerFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 13, flexDirection: 'row', alignItems: 'center' },
  photoButton: { minHeight: 42, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  emojiButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  photoText: { fontSize: 13, fontWeight: '800' },
  photoCount: { marginLeft: 'auto', fontSize: 12, fontWeight: '700' },
  note: { flexDirection: 'row', gap: 9, padding: 14, borderRadius: 15, marginTop: 16, alignItems: 'center' },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  button: { minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
