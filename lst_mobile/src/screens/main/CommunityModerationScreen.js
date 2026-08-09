import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import EmojiText from '../../components/EmojiText';
import Loader from '../../components/Loader';
import { useTheme } from '../../context/ThemeContext';

const emptyQueue = () => ({ data: [], page: 0, hasMore: true, total: 0 });
const answerLabel = key => key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, value => value.toUpperCase());
const answerValue = value => {
  if (Array.isArray(value)) return value.map(answerValue).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${answerLabel(key)}: ${answerValue(item)}`).join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

export default function CommunityModerationScreen({ route, navigation }) {
  const { communityId, communityName } = route.params;
  const { theme } = useTheme();
  const [tab, setTab] = useState('applications');
  const [queues, setQueues] = useState({ applications: emptyQueue(), posts: emptyQueue() });
  const [counts, setCounts] = useState({ applications: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadQueue = useCallback(async (kind, page = 1) => {
    try {
      const response = await apiService.getCommunityModeration(communityId, kind, page);
      setCounts(response.counts || { applications: 0, posts: 0 });
      setQueues(current => {
        const existing = page === 1 ? [] : current[kind].data;
        const known = new Set(existing.map(item => String(item.id)));
        const incoming = (response.data || []).filter(item => !known.has(String(item.id)));
        return {
          ...current,
          [kind]: {
            data: [...existing, ...incoming],
            page: response.currentPage || page,
            hasMore: Boolean(response.hasMorePages),
            total: response.total || 0,
          },
        };
      });
    } catch (error) {
      Alert.alert('Could not load requests', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [communityId]);

  useFocusEffect(useCallback(() => {
    loadQueue(tab, 1);
  }, [loadQueue, tab]));

  const selectTab = kind => {
    setTab(kind);
  };

  const loadMore = () => {
    const queue = queues[tab];
    if (!queue.hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    loadQueue(tab, queue.page + 1);
  };

  const openDetails = item => navigation.navigate('CommunityModerationDetail', {
    communityId,
    communityName,
    kind: tab,
    item,
  });

  if (loading && queues[tab].page === 0) return <Loader />;
  const queue = queues[tab];

  const header = <>
    <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}>
      <View style={[styles.summaryIcon, { backgroundColor: theme.card }]}><AppIcon name="shield-checkmark-outline" size={21} color={theme.primary} /></View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>{communityName}</Text>
        <Text style={[styles.summaryText, { color: theme.secondaryText }]}>Open each request to review all details before deciding.</Text>
      </View>
    </View>
    <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {[['applications', 'Applications'], ['posts', 'Posts']].map(([value, label]) => (
        <TouchableOpacity key={value} style={[styles.tab, tab === value && { backgroundColor: theme.primary }]} onPress={() => selectTab(value)}>
          <Text style={[styles.tabText, { color: tab === value ? '#FFFFFF' : theme.secondaryText }]}>{label}</Text>
          <View style={[styles.count, { backgroundColor: tab === value ? 'rgba(255,255,255,.18)' : theme.primarySoft }]}>
            <Text style={[styles.countText, { color: tab === value ? '#FFFFFF' : theme.primary }]}>{counts[value]}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </>;

  return <FlatList
    style={[styles.screen, { backgroundColor: theme.background }]}
    contentContainerStyle={[styles.content, queue.data.length === 0 && styles.emptyContent]}
    data={queue.data}
    keyExtractor={item => `${tab}-${item.id}`}
    ListHeaderComponent={header}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQueue(tab, 1); }} tintColor={theme.primary} />}
    onEndReached={loadMore}
    onEndReachedThreshold={0.35}
    ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : null}
    ListEmptyComponent={<View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}><AppIcon name="check-circle" size={28} color={theme.primary} /><Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing pending</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>New {tab} will appear here when they need review.</Text></View>}
    renderItem={({ item }) => {
      const application = tab === 'applications';
      const answers = Object.entries(item.answers || {}).slice(0, 2);
      return <TouchableOpacity activeOpacity={0.86} onPress={() => openDetails(item)} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.author}>
          <Avatar uri={application ? item.user.avatar : item.userAvatar} size={46} />
          <View style={styles.authorCopy}>
            <Text style={[styles.authorName, { color: theme.text }]}>{application ? item.user.name : item.userName}</Text>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>{application ? item.user.email : item.timestamp}</Text>
            <Text style={[styles.meta, { color: theme.secondaryText }]}>{application ? `Submitted ${item.submittedAt}` : 'Community post awaiting review'}</Text>
          </View>
          <AppIcon name="chevron-right" size={17} color={theme.primary} />
        </View>
        {application ? <View style={[styles.preview, { borderTopColor: theme.border }]}>
          {answers.map(([key, value]) => <View key={key} style={styles.previewAnswer}><Text style={[styles.previewLabel, { color: theme.secondaryText }]}>{answerLabel(key)}</Text><Text numberOfLines={2} style={[styles.previewValue, { color: theme.text }]}>{answerValue(value)}</Text></View>)}
          <Text style={[styles.detailHint, { color: theme.primary }]}>View all application details</Text>
        </View> : <>
          <EmojiText numberOfLines={3} style={[styles.postContent, { color: theme.text }]}>{item.content}</EmojiText>
          {(item.images?.[0] || item.image) ? <Image source={{ uri: item.images?.[0] || item.image }} style={styles.postImage} /> : null}
          <Text style={[styles.detailHint, { color: theme.primary }]}>Review full post</Text>
        </>}
      </TouchableOpacity>;
    }}
  />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 14, paddingBottom: 42 },
  emptyContent: { flexGrow: 1 },
  summary: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: '800' },
  summaryText: { fontSize: 10.5, lineHeight: 16, marginTop: 3 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 4, marginTop: 13, marginBottom: 14 },
  tab: { flex: 1, minHeight: 42, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tabText: { fontSize: 11.5, fontWeight: '800' },
  count: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontSize: 10, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 11 },
  author: { flexDirection: 'row', alignItems: 'center' },
  authorCopy: { flex: 1, marginLeft: 10 },
  authorName: { fontSize: 13.5, fontWeight: '800' },
  meta: { fontSize: 10.5, marginTop: 2 },
  preview: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 9 },
  previewAnswer: { marginBottom: 8 },
  previewLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  previewValue: { fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  postContent: { fontSize: 13, lineHeight: 20, marginTop: 14 },
  postImage: { width: '100%', height: 150, resizeMode: 'cover', borderRadius: 13, marginTop: 10 },
  detailHint: { fontSize: 11, fontWeight: '800', marginTop: 10 },
  loader: { paddingVertical: 18 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 30, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginTop: 10 },
  emptyText: { fontSize: 11, textAlign: 'center', marginTop: 5 },
});
