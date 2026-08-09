import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import EmojiText from '../../components/EmojiText';
import { useTheme } from '../../context/ThemeContext';

const IMAGE_WIDTH = Dimensions.get('window').width - 28;
const answerLabel = key => key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, value => value.toUpperCase());
const answerValue = value => {
  if (Array.isArray(value)) return value.map(answerValue).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${answerLabel(key)}: ${answerValue(item)}`).join('\n');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

export default function CommunityModerationDetailScreen({ route, navigation }) {
  const { communityId, communityName, kind, item } = route.params;
  const { theme } = useTheme();
  const [working, setWorking] = useState(false);
  const application = kind === 'applications';
  const images = item.images?.length ? item.images : item.image ? [item.image] : [];

  const review = action => Alert.alert(
    `${action === 'approve' ? 'Approve' : 'Reject'} this ${application ? 'application' : 'post'}?`,
    action === 'approve' ? 'It will be accepted immediately.' : 'It will be removed from the pending queue.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: action === 'approve' ? 'Approve' : 'Reject', style: action === 'reject' ? 'destructive' : 'default', onPress: async () => {
        setWorking(true);
        try {
          if (application) await apiService.reviewCommunityApplication(communityId, item.id, action);
          else await apiService.reviewCommunityPost(communityId, item.id, action);
          navigation.goBack();
          setTimeout(() => Alert.alert(
            'Review saved',
            `The ${application ? 'application' : 'post'} was ${action === 'approve' ? 'approved' : 'rejected'}.`,
          ), 250);
        } catch (error) {
          Alert.alert('Review not saved', error.message);
        } finally {
          setWorking(false);
        }
      } },
    ],
  );

  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.community, { color: theme.primary }]}>{communityName}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.author}>
          <Avatar uri={application ? item.user.avatar : item.userAvatar} size={52} />
          <View style={styles.authorCopy}>
            <Text style={[styles.name, { color: theme.text }]}>{application ? item.user.name : item.userName}</Text>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>{application ? item.user.email : item.timestamp}</Text>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>{application ? item.submittedAtFull || `Submitted ${item.submittedAt}` : 'Pending community post'}</Text>
          </View>
          <View style={[styles.pending, { backgroundColor: theme.accentSoft }]}><Text style={[styles.pendingText, { color: theme.accent }]}>Pending</Text></View>
        </View>
        {application && item.user.bio ? <Text style={[styles.bio, { color: theme.secondaryText }]}>{item.user.bio}</Text> : null}

        {application ? <View style={[styles.answers, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Application answers</Text>
          {Object.entries(item.answers || {}).map(([key, value]) => <View key={key} style={[styles.answer, { backgroundColor: theme.background }]}><Text style={[styles.answerLabel, { color: theme.secondaryText }]}>{answerLabel(key)}</Text><Text style={[styles.answerText, { color: theme.text }]}>{answerValue(value)}</Text></View>)}
        </View> : <View style={[styles.post, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Post content</Text>
          <EmojiText style={[styles.postText, { color: theme.text }]}>{item.content}</EmojiText>
          {images.length ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>{images.map((image, index) => <View key={`${image}-${index}`} style={styles.imageWrap}><Image source={{ uri: image }} style={styles.image} />{images.length > 1 ? <View style={styles.imageCount}><Text style={styles.imageCountText}>{index + 1}/{images.length}</Text></View> : null}</View>)}</ScrollView> : null}
        </View>}
      </View>
    </ScrollView>
    <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <TouchableOpacity style={[styles.reject, { borderColor: theme.border }]} onPress={() => review('reject')} disabled={working}><Text style={[styles.rejectText, { color: theme.danger }]}>Reject</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.approve, { backgroundColor: theme.primary }]} onPress={() => review('approve')} disabled={working}>{working ? <ActivityIndicator color="#FFFFFF" /> : <><AppIcon name="check" size={16} color="#FFFFFF" /><Text style={styles.approveText}>Approve</Text></>}</TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 14, paddingBottom: 28 },
  community: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 20, padding: 15 },
  author: { flexDirection: 'row', alignItems: 'center' },
  authorCopy: { flex: 1, marginLeft: 11 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 10.5, marginTop: 3 },
  pending: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  pendingText: { fontSize: 9, fontWeight: '800' },
  bio: { fontSize: 11.5, lineHeight: 18, marginTop: 13 },
  answers: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 15, paddingTop: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  answer: { borderRadius: 13, padding: 12, marginBottom: 9 },
  answerLabel: { fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.45 },
  answerText: { fontSize: 12.5, lineHeight: 19, marginTop: 5 },
  post: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 15, paddingTop: 15 },
  postText: { fontSize: 14, lineHeight: 22 },
  gallery: { marginTop: 13, marginHorizontal: -15 },
  imageWrap: { width: IMAGE_WIDTH, height: 280 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageCount: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,.65)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  imageCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', gap: 10 },
  reject: { flex: 1, height: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontSize: 12, fontWeight: '800' },
  approve: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  approveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
