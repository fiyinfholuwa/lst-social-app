import React from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllRead, loadMore, loading } = useNotifications();

  const openNotification = async notification => {
    try {
      await markAsRead(notification.id);
    } catch (error) {
      // Opening the destination should not be blocked by a transient read-state failure.
      console.error('Unable to mark notification as read:', error);
    }

    const parameterRequirements = {
      PostDetail: 'postId', UserProfile: 'userId', ChatDetail: 'chatId',
      CommunityDetail: 'communityId', CommunityMembers: 'communityId',
      CommunityApplication: 'communityId', CommunityModeration: 'communityId',
      SermonDetail: 'sermonId',
    };
    const routesWithoutParams = new Set(['MainTabs', 'SavedPosts', 'Friends', 'FriendRequests', 'BlockedAccounts', 'Notifications', 'HelpCenter', 'Feedback']);
    const requiredParam = parameterRequirements[notification.screen];
    if (requiredParam && notification.routeParams?.[requiredParam] != null) {
      navigation.navigate(notification.screen, notification.routeParams);
    } else if (routesWithoutParams.has(notification.screen)) {
      navigation.navigate(notification.screen);
    }
  };

  const markEverythingRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      Alert.alert('Couldn’t update notifications', error.message || 'Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.summary, { borderBottomColor: theme.border }]}>
        <Text style={[styles.summaryText, { color: theme.secondaryText }]}>
          {unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You’re all caught up'}
        </Text>
        {unreadCount ? (
          <TouchableOpacity style={styles.markAllButton} onPress={markEverythingRead}>
            <Text style={[styles.markAll, { color: theme.primary }]}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading && notifications.length ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notification,
              {
                backgroundColor: item.unread ? theme.primarySoft : theme.card,
                borderColor: item.unread ? theme.primary : theme.border,
              },
            ]}
            onPress={() => openNotification(item)}
          >
            <View style={[styles.icon, { backgroundColor: theme.background }]}>
              <AppIcon name={item.icon} size={17} color={theme.primary} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                {item.unread ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}
              </View>
              <Text style={[styles.message, { color: theme.secondaryText }]}>{item.message}</Text>
              <Text style={[styles.time, { color: theme.primary }]}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="bell" size={28} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications yet</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              Community updates and activity will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  summaryText: { flex: 1, minWidth: 0, marginRight: 10, fontSize: 12, lineHeight: 17, fontWeight: '600', flexShrink: 1 },
  markAllButton: { flexShrink: 0, paddingVertical: 7, paddingLeft: 6 },
  markAll: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  list: { padding: 14, paddingBottom: 40 },
  notification: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1, borderRadius: 17, marginBottom: 10, overflow: 'visible' },
  icon: { width: 39, height: 39, flexShrink: 0, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18, fontWeight: '700', flexShrink: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 8 },
  message: { width: '100%', flexShrink: 1, fontSize: 12, lineHeight: 18, marginTop: 4 },
  time: { alignSelf: 'flex-start', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 7 },
  empty: { alignItems: 'center', paddingHorizontal: 35, paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  footer: { paddingVertical: 18 },
});
