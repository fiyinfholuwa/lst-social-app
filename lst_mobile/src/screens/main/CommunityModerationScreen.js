import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import EmojiText from '../../components/EmojiText';
import Loader from '../../components/Loader';
import { useTheme } from '../../context/ThemeContext';

const answerLabel = key => key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, value => value.toUpperCase());
const answerValue = value => {
  if (Array.isArray(value)) return value.map(answerValue).join(', ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${answerLabel(key)}: ${answerValue(item)}`).join('\n');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

export default function CommunityModerationScreen({ route }) {
  const { communityId, communityName } = route.params;
  const { theme } = useTheme();
  const [tab, setTab] = useState('applications');
  const [queue, setQueue] = useState({ applications: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingKey, setWorkingKey] = useState('');

  const loadQueue = useCallback(async () => {
    try { setQueue(await apiService.getCommunityModeration(communityId)); }
    catch (error) { Alert.alert('Could not load requests', error.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, [communityId]);

  useFocusEffect(useCallback(() => { loadQueue(); }, [loadQueue]));

  const review = (kind, item, action) => Alert.alert(
    `${action === 'approve' ? 'Approve' : 'Reject'} this ${kind === 'applications' ? 'application' : 'post'}?`,
    action === 'approve' ? 'It will be accepted immediately.' : 'This decision removes it from the pending queue.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: action === 'approve' ? 'Approve' : 'Reject', style: action === 'reject' ? 'destructive' : 'default', onPress: async () => {
        const key = `${kind}-${item.id}`;
        setWorkingKey(key);
        try {
          if (kind === 'applications') await apiService.reviewCommunityApplication(communityId, item.id, action);
          else await apiService.reviewCommunityPost(communityId, item.id, action);
          setQueue(current => ({ ...current, [kind]: current[kind].filter(entry => entry.id !== item.id) }));
        } catch (error) { Alert.alert('Review not saved', error.message); }
        finally { setWorkingKey(''); }
      } },
    ],
  );

  if (loading) return <Loader />;
  const items = queue[tab];

  return <ScrollView style={[styles.screen, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQueue(); }} tintColor={theme.primary} />}>
    <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}><View style={[styles.summaryIcon, { backgroundColor: theme.card }]}><AppIcon name="shield-checkmark-outline" size={21} color={theme.primary} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryTitle, { color: theme.text }]}>{communityName}</Text><Text style={[styles.summaryText, { color: theme.secondaryText }]}>Review pending items carefully before making a decision.</Text></View></View>

    <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {[['applications', 'Applications'], ['posts', 'Posts']].map(([value, label]) => <TouchableOpacity key={value} style={[styles.tab, tab === value && { backgroundColor: theme.primary }]} onPress={() => setTab(value)}><Text style={[styles.tabText, { color: tab === value ? '#FFFFFF' : theme.secondaryText }]}>{label}</Text><View style={[styles.count, { backgroundColor: tab === value ? 'rgba(255,255,255,.18)' : theme.primarySoft }]}><Text style={[styles.countText, { color: tab === value ? '#FFFFFF' : theme.primary }]}>{queue[value].length}</Text></View></TouchableOpacity>)}
    </View>

    {items.length === 0 ? <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}><AppIcon name="check-circle" size={28} color={theme.primary} /><Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing pending</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>New {tab} will appear here when they need review.</Text></View> : items.map(item => {
      const working = workingKey === `${tab}-${item.id}`;
      return <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.author}><Avatar uri={tab === 'applications' ? item.user.avatar : item.userAvatar} size={46} /><View style={styles.authorCopy}><Text style={[styles.authorName, { color: theme.text }]}>{tab === 'applications' ? item.user.name : item.userName}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{tab === 'applications' ? item.user.email : item.timestamp}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{tab === 'applications' ? `Submitted ${item.submittedAt}` : 'Pending post review'}</Text></View><View style={[styles.pending, { backgroundColor: theme.accentSoft }]}><Text style={[styles.pendingText, { color: theme.accent }]}>Pending</Text></View></View>
        {tab === 'applications' ? <View style={[styles.answers, { borderTopColor: theme.border }]}>{Object.entries(item.answers || {}).map(([key, value]) => <View key={key} style={styles.answer}><Text style={[styles.answerLabel, { color: theme.secondaryText }]}>{answerLabel(key)}</Text><Text style={[styles.answerValue, { color: theme.text }]}>{answerValue(value)}</Text></View>)}</View> : <><EmojiText style={[styles.postContent, { color: theme.text }]}>{item.content}</EmojiText>{(item.images?.[0] || item.image) ? <Image source={{ uri: item.images?.[0] || item.image }} style={styles.postImage} /> : null}</>}
        <View style={styles.actions}><TouchableOpacity style={[styles.reject, { borderColor: theme.border }]} onPress={() => review(tab, item, 'reject')} disabled={working}><Text style={[styles.rejectText, { color: theme.danger }]}>Reject</Text></TouchableOpacity><TouchableOpacity style={[styles.approve, { backgroundColor: theme.primary }]} onPress={() => review(tab, item, 'approve')} disabled={working}>{working ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><AppIcon name="check" size={15} color="#FFFFFF" /><Text style={styles.approveText}>Approve</Text></>}</TouchableOpacity></View>
      </View>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 14, paddingBottom: 42 }, summary: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, summaryIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1 }, summaryTitle: { fontSize: 14, fontWeight: '800' }, summaryText: { fontSize: 10.5, lineHeight: 16, marginTop: 3 }, tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 4, marginTop: 13, marginBottom: 14 }, tab: { flex: 1, minHeight: 42, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, tabText: { fontSize: 11.5, fontWeight: '800' }, count: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, countText: { fontSize: 10, fontWeight: '800' }, card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 11 }, author: { flexDirection: 'row', alignItems: 'center' }, authorCopy: { flex: 1, marginLeft: 10 }, authorName: { fontSize: 13.5, fontWeight: '800' }, meta: { fontSize: 10.5, marginTop: 2 }, pending: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 }, pendingText: { fontSize: 9, fontWeight: '800' }, answers: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 8 }, answer: { paddingVertical: 6 }, answerLabel: { fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }, answerValue: { fontSize: 12, lineHeight: 18, marginTop: 3 }, postContent: { fontSize: 13, lineHeight: 20, marginTop: 14 }, postImage: { width: '100%', height: 190, resizeMode: 'cover', borderRadius: 14, marginTop: 11 }, actions: { flexDirection: 'row', gap: 9, marginTop: 15 }, reject: { flex: 1, height: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rejectText: { fontSize: 12, fontWeight: '800' }, approve: { flex: 1, height: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, approveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, empty: { borderWidth: 1, borderRadius: 18, padding: 30, alignItems: 'center' }, emptyTitle: { fontSize: 14, fontWeight: '800', marginTop: 10 }, emptyText: { fontSize: 11, textAlign: 'center', marginTop: 5 } });
