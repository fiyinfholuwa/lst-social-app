import React from 'react';
        import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
        import { useTheme } from '../context/ThemeContext';
        import Icon from './AppIcon';

        export default function PostCard({ post, onPress, onLike }) {
          const { theme } = useTheme();

          return (
            <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.header}>
                <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>{post.userName}</Text>
                  <Text style={[styles.timestamp, { color: theme.secondaryText }]}>{post.timestamp}</Text>
                </View>
              </View>
              <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
              {post.image && <Image source={{ uri: post.image }} style={styles.image} />}
              <View style={styles.actions}>
                <TouchableOpacity onPress={onLike} style={styles.actionButton}>
                  <Icon name="heart-outline" size={20} color={theme.accent} />
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="bookmark-outline" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onPress} style={styles.actionButton}>
                  <Icon name="chatbubble-outline" size={20} color={theme.tint} />
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>{post.comments.length}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }

        const styles = StyleSheet.create({
          card: { marginHorizontal: 14, marginBottom: 12, padding: 14, borderRadius: 18, borderWidth: 1 },
          header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
          avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
          userInfo: { flex: 1 },
          userName: { fontWeight: '600', fontSize: 16 },
          timestamp: { fontSize: 12 },
          content: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
          image: { width: '100%', height: 210, borderRadius: 14, marginBottom: 10, resizeMode: 'cover' },
          actions: { flexDirection: 'row', gap: 24, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: 11, marginTop: 4 },
          actionButton: { flexDirection: 'row', alignItems: 'center' },
          actionText: { marginLeft: 4, fontSize: 14 },
        });
      
