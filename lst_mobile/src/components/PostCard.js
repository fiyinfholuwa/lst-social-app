import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from './AppIcon';

const PREVIEW_LIMIT = 180;

export default function PostCard({ post, onPress, onUserPress, onLike, onShare, onSave, isSaved = false }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > PREVIEW_LIMIT;
  const postType = post.type || (post.communityId ? 'Community' : 'Encouragement');

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onUserPress} disabled={!onUserPress}>
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
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
          <TouchableOpacity style={styles.moreButton} hitSlop={10}>
            <Icon name="ellipsis-h" size={18} color={theme.secondaryText} />
          </TouchableOpacity>
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

      {post.image ? (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          <Image source={{ uri: post.image }} style={styles.image} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.secondaryText }]}>
          {post.likes > 0 ? `${post.likes} ${post.likes === 1 ? 'person' : 'people'} encouraged this` : 'Be the first to encourage'}
        </Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.countText, { color: theme.secondaryText }]}>
            {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={onLike} style={styles.iconAction} accessibilityLabel="Encourage this post">
          <Icon name="heart" size={18} color={theme.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress} style={styles.iconAction} accessibilityLabel="View comments">
          <Icon name="comment" size={18} color={theme.primary} />
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
  card: { marginHorizontal: 14, marginBottom: 12, padding: 15, borderRadius: 18, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userName: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 11, marginTop: 3 },
  moreButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  contextText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 14, lineHeight: 22 },
  readMoreButton: { alignSelf: 'flex-start', paddingVertical: 5 },
  readMore: { fontSize: 13, fontWeight: '700' },
  image: { width: '100%', height: 220, borderRadius: 14, marginTop: 7, resizeMode: 'cover' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 10 },
  countText: { fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 8, gap: 8 },
  iconAction: { width: 40, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookmarkButton: { marginLeft: 'auto' },
});
