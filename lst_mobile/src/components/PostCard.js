import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Icon from './AppIcon';
import Avatar from './Avatar';
import PostOptionsMenu from './PostOptionsMenu';
import EmojiText from './EmojiText';
import ReportModal from './ReportModal';
import LikersModal from './LikersModal';
import apiService from '../api/apiService';
import { copyPostLink } from '../utils/postLinks';

const PREVIEW_LIMIT = 180;
const CARD_IMAGE_WIDTH = Dimensions.get('window').width - 58;

function PostCard({ post, onPress, onOriginalPress, onUserPress, onLike, onShare, onSave, onEdit, onDelete, isSaved = false, containerStyle }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [likersVisible, setLikersVisible] = useState(false);
  const loadLikes = useCallback(page => apiService.getPostLikes(post.id, page), [post.id]);
  const isLong = post.content.length > PREVIEW_LIMIT;
  const postType = post.type || (post.communityId ? 'Community' : 'Encouragement');
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];
  const original = post.originalPost;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, containerStyle]}>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onUserPress} disabled={!onUserPress}>
            <Avatar uri={post.userAvatar} size={44} style={styles.avatar} accessibilityLabel={`${post.userName}'s profile avatar`} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.userInfo} onPress={onUserPress} disabled={!onUserPress} accessibilityRole="button">
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
              {post.verified ? <Icon name="check-circle" solid size={13} color={theme.primary} /> : null}
            </View>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>
              {post.timestamp}{post.audience ? `  •  ${post.audience}` : '  •  LST community'}
            </Text>
            {post.status === 'pending' ? <Text style={[styles.pending, { backgroundColor: theme.accentSoft, color: theme.accentDark }]}>Pending approval</Text> : null}
          </TouchableOpacity>
          <PostOptionsMenu onCopyLink={() => copyPostLink(post.publicId || post.id)} onEdit={onEdit} onDelete={onDelete} onReport={String(post.userId) !== String(user?.id) ? () => setReporting(true) : undefined} />
        </View>

        <View style={styles.contextRow}>
          <Icon
            name={postType === 'Prayer' ? 'heart' : postType === 'Testimony' ? 'sparkles-outline' : 'users'}
            solid
            size={10}
            color={theme.secondaryText}
          />
          <Text style={[styles.contextText, { color: theme.secondaryText }]}>{postType}</Text>
        </View>

        {post.content ? <EmojiText
          style={[styles.content, { color: theme.text }]}
          numberOfLines={expanded ? undefined : 4}
        >
          {post.content}
        </EmojiText> : null}
      </Pressable>

      {isLong ? (
        <TouchableOpacity onPress={() => setExpanded(value => !value)} style={styles.readMoreButton}>
          <Text style={[styles.readMore, { color: theme.primary }]}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {images.length ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {images.map((image, index) => (
            <TouchableOpacity key={`${image}-${index}`} activeOpacity={0.9} onPress={onPress} style={styles.imageWrap}>
              <Image source={{ uri: image }} style={styles.image} />
              {images.length > 1 ? <View style={styles.imageCount}><Text style={styles.imageCountText}>{index + 1}/{images.length}</Text></View> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {original ? <TouchableOpacity style={[styles.originalPost, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={onOriginalPress || onPress} activeOpacity={0.86}>
        <View style={styles.originalAuthorRow}>
          <Avatar uri={original.userAvatar} size={32} accessibilityLabel={`${original.userName}'s profile avatar`} />
          <View style={styles.originalAuthorCopy}>
            <Text style={[styles.originalAuthor, { color: theme.text }]}>{original.userName}</Text>
            <Text style={[styles.originalMeta, { color: theme.secondaryText }]}>Original post</Text>
          </View>
        </View>
        <EmojiText style={[styles.originalText, { color: theme.text }]} numberOfLines={4}>{original.content}</EmojiText>
        {(original.images?.[0] || original.image) ? <Image source={{ uri: original.images?.[0] || original.image }} style={styles.originalImage} /> : null}
      </TouchableOpacity> : null}

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <View style={styles.countAction}>
          <TouchableOpacity onPress={onLike} style={styles.likeButton} accessibilityLabel="Encourage this post"><Icon name="heart" solid={post.likedByCurrentUser} size={18} color={theme.accent} /></TouchableOpacity>
          <TouchableOpacity onPress={() => post.likes > 0 && setLikersVisible(true)} disabled={!post.likes} style={styles.likeCountButton} accessibilityLabel={`View ${post.likes} people who liked this post`}><Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.likes}</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onPress} style={styles.countAction} accessibilityLabel={`${post.commentsCount || 0} comments`}>
          <Icon name="comment" size={18} color={theme.primary} />
          <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>
        {onShare ? <TouchableOpacity style={styles.countAction} accessibilityLabel={`${post.shareCount || 0} shares`} onPress={onShare}>
          <Icon name="share-alt" size={18} color={theme.secondaryText} />
          <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.shareCount || 0}</Text>
        </TouchableOpacity> : null}
        <TouchableOpacity style={[styles.iconAction, styles.bookmarkButton]} accessibilityLabel={isSaved ? 'Remove saved post' : 'Save post'} onPress={onSave}>
          <Icon name="bookmark" size={18} color={isSaved ? theme.accent : theme.secondaryText} />
        </TouchableOpacity>
      </View>
      <ReportModal visible={reporting} targetType="post" targetId={post.id} targetName="post" onClose={result => { setReporting(false); if (result?.submitted) Alert.alert('Report received', 'Thank you. The moderation team will review this post.'); }} />
      <LikersModal visible={likersVisible} onClose={() => setLikersVisible(false)} loadPage={loadLikes} navigation={navigation} title="Post likes" />
    </View>
  );
}

const samePostCard = (previous, next) => (
  previous.post === next.post
  && previous.isSaved === next.isSaved
  && previous.containerStyle === next.containerStyle
  && Boolean(previous.onEdit) === Boolean(next.onEdit)
  && Boolean(previous.onDelete) === Boolean(next.onDelete)
);

export default React.memo(PostCard, samePostCard);

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, marginBottom: 12, padding: 15, borderRadius: 18, borderWidth: 1, overflow: 'visible' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 100, elevation: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 11, marginTop: 3 },
  pending: { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', fontSize: 9, fontWeight: '800' },
  moreButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, zIndex: 0 },
  contextText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 14, lineHeight: 22, zIndex: 0 },
  readMoreButton: { alignSelf: 'flex-start', paddingVertical: 5 },
  readMore: { fontSize: 13, fontWeight: '700' },
  gallery: { marginTop: 7, borderRadius: 14 },
  imageWrap: { width: CARD_IMAGE_WIDTH, height: 230, marginRight: 8 },
  image: { width: '100%', height: '100%', borderRadius: 14, resizeMode: 'cover' },
  imageCount: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(31,18,25,0.72)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  imageCountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, marginTop: 12, paddingTop: 8 },
  countAction: { minWidth: 47, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 3 },
  likeButton: { width: 27, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  likeCountButton: { minWidth: 20, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  actionCount: { fontSize: 12, fontWeight: '700' },
  iconAction: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  originalPost: { borderWidth: 1, borderRadius: 15, padding: 12, marginTop: 11 },
  originalAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  originalAuthorCopy: { flex: 1, marginLeft: 9 },
  originalAuthor: { fontSize: 12, fontWeight: '800' },
  originalMeta: { fontSize: 9, marginTop: 2 },
  originalText: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  originalImage: { width: '100%', height: 180, borderRadius: 11, resizeMode: 'cover', marginTop: 10 },
  bookmarkButton: { marginLeft: 'auto' },
});
