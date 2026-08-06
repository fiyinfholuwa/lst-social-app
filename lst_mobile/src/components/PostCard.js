import React, { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from './AppIcon';
import Avatar from './Avatar';
import PostOptionsMenu from './PostOptionsMenu';

const PREVIEW_LIMIT = 180;
const CARD_IMAGE_WIDTH = Dimensions.get('window').width - 58;

export default function PostCard({ post, onPress, onUserPress, onLike, onShare, onSave, onEdit, onDelete, isSaved = false }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > PREVIEW_LIMIT;
  const postType = post.type || (post.communityId ? 'Community' : 'Encouragement');
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onUserPress} disabled={!onUserPress}>
            <Avatar uri={post.userAvatar} size={44} style={styles.avatar} accessibilityLabel={`${post.userName}'s profile avatar`} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
              {post.verified ? <Icon name="check-circle" solid size={13} color={theme.primary} /> : null}
            </View>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>
              {post.timestamp}{post.audience ? `  •  ${post.audience}` : '  •  LST community'}
            </Text>
          </View>
          {onEdit && onDelete ? <PostOptionsMenu onEdit={onEdit} onDelete={onDelete} /> : null}
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

        <Text
          style={[styles.content, { color: theme.text }]}
          numberOfLines={expanded ? undefined : 4}
        >
          {post.content}
        </Text>
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

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={onLike} style={styles.countAction} accessibilityLabel={`${post.likes} encouragements`}>
          <Icon name="heart" solid={post.likedByCurrentUser} size={18} color={theme.accent} />
          <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress} style={styles.countAction} accessibilityLabel={`${post.comments.length} comments`}>
          <Icon name="comment" size={18} color={theme.primary} />
          <Text style={[styles.actionCount, { color: theme.secondaryText }]}>{post.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconAction} accessibilityLabel="Share post" onPress={onShare}>
          <Icon name="share-alt" size={18} color={theme.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconAction, styles.bookmarkButton]} accessibilityLabel={isSaved ? 'Remove saved post' : 'Save post'} onPress={onSave}>
          <Icon name="bookmark" size={18} color={isSaved ? theme.accent : theme.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, marginBottom: 12, padding: 15, borderRadius: 18, borderWidth: 1, overflow: 'visible' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 100, elevation: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 11, marginTop: 3 },
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
  actionCount: { fontSize: 12, fontWeight: '700' },
  iconAction: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookmarkButton: { marginLeft: 'auto' },
});
