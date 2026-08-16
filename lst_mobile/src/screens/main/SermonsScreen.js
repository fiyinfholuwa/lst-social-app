import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';

const CACHE_PREFIX = 'sermons:list:v1:';
const EMPTY_FILTERS = { title: '', speaker: '', category: '' };

export default function SermonsScreen({ navigation }) {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const cacheKey = useMemo(() => `${CACHE_PREFIX}${JSON.stringify(filters)}`, [filters]);
  const activeFilterCount = [filters.title, filters.speaker, filters.category].filter(Boolean).length;

  const applyResponse = useCallback((response, requestedPage) => {
    setCategories(response.categories || []);
    setSermons(current => requestedPage === 1 ? response.data || [] : [...current, ...(response.data || [])]);
    setPage(response.currentPage || requestedPage);
    setHasMore(Boolean(response.hasMorePages));
  }, []);

  const loadSermons = useCallback(async (requestedPage = 1, { silent = false } = {}) => {
    if (requestedPage === 1 && !silent) setLoading(true); else if (requestedPage > 1) setLoadingMore(true);
    try {
      const response = await apiService.getSermons(filters, requestedPage);
      applyResponse(response, requestedPage);
      if (requestedPage === 1) await AsyncStorage.setItem(cacheKey, JSON.stringify(response));
    } catch (error) {
      if (!silent) Alert.alert('Couldn’t load sermons', error.message || 'Please try again.');
    } finally { setLoading(false); setLoadingMore(false); }
  }, [applyResponse, cacheKey, filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    AsyncStorage.getItem(cacheKey).then(value => {
      if (!active || !value) return;
      try { applyResponse(JSON.parse(value), 1); setLoading(false); } catch {}
    });
    return () => { active = false; };
  }, [applyResponse, cacheKey]);

  useFocusEffect(useCallback(() => { loadSermons(1, { silent: true }); }, [loadSermons]));

  const refresh = async () => { setRefreshing(true); await loadSermons(1, { silent: true }); setRefreshing(false); };
  const openFilters = () => { setDraft(filters); setFilterVisible(true); };
  const applyFilters = () => { setFilters(draft); setFilterVisible(false); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setFilterVisible(false); };
  const playSermon = sermon => navigation.navigate('SermonDetail', { sermonId: sermon.id });

  const Header = () => <View style={styles.headerRow}>
    <Text style={[styles.resultLabel, { color: theme.secondaryText }]}>{activeFilterCount ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} applied` : 'All sermons'}</Text>
    <TouchableOpacity onPress={openFilters} style={[styles.filterButton, { backgroundColor: activeFilterCount ? theme.primary : theme.card, borderColor: activeFilterCount ? theme.primary : theme.border }]} accessibilityLabel="Filter sermons">
      <AppIcon name="filter" size={16} color={activeFilterCount ? '#FFFFFF' : theme.text} /><Text style={[styles.filterText, { color: activeFilterCount ? '#FFFFFF' : theme.text }]}>Filter</Text>
      {activeFilterCount ? <View style={styles.badge}><Text style={styles.badgeText}>{activeFilterCount}</Text></View> : null}
    </TouchableOpacity>
  </View>;

  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScreenHeader eyebrow="WATCH AND GROW" title="Sermons" />
    <FlatList data={sermons} keyExtractor={item => item.id} ListHeaderComponent={<Header />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }, !sermons.length && styles.emptyContent]} onEndReached={() => hasMore && !loadingMore && loadSermons(page + 1)} onEndReachedThreshold={0.4} ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : null} ListEmptyComponent={loading ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play-circle-outline" size={27} color={theme.primary} /></View><Text style={[styles.emptyTitle, { color: theme.text }]}>No sermons found</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Try changing or clearing the filters.</Text></View>} renderItem={({ item }) => <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.playIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play" size={18} color={theme.primary} /></View><View style={styles.copy}><Text style={[styles.title, { color: theme.text }]}>{item.title}</Text><Text style={[styles.meta, { color: theme.primary }]}>{[item.category?.name, item.speaker].filter(Boolean).join(' · ')}</Text>{item.description ? <Text numberOfLines={2} style={[styles.description, { color: theme.secondaryText }]}>{item.description}</Text> : null}<View style={styles.engagement}><View style={styles.engagementItem}><AppIcon name="heart" size={12} color={theme.secondaryText} /><Text style={[styles.engagementText, { color: theme.secondaryText }]}>{item.likes || 0}</Text></View><View style={styles.engagementItem}><AppIcon name="comments" size={12} color={theme.secondaryText} /><Text style={[styles.engagementText, { color: theme.secondaryText }]}>{item.commentsCount || 0}</Text></View></View></View><TouchableOpacity style={[styles.playButton, { backgroundColor: theme.primary }]} onPress={() => playSermon(item)}><AppIcon name="play" size={12} color="#FFFFFF" /><Text style={styles.playText}>Play</Text></TouchableOpacity></View>} />
    <Modal visible={filterVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setFilterVisible(false)}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.backdrop} onPress={() => setFilterVisible(false)}><Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} /><View style={styles.sheetHeading}><View><Text style={[styles.sheetTitle, { color: theme.text }]}>Filter sermons</Text><Text style={[styles.sheetSubtitle, { color: theme.secondaryText }]}>Find the message you need</Text></View><TouchableOpacity onPress={() => setFilterVisible(false)} style={[styles.close, { backgroundColor: theme.background }]}><AppIcon name="times" size={16} color={theme.text} /></TouchableOpacity></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
        <Text style={[styles.label, { color: theme.text }]}>Sermon title</Text><View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}><AppIcon name="search" size={16} color={theme.secondaryText} /><TextInput value={draft.title} onChangeText={title => setDraft(current => ({ ...current, title }))} placeholder="Enter a sermon title" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} /></View>
        <Text style={[styles.label, { color: theme.text }]}>Preacher</Text><View style={[styles.inputWrap, { backgroundColor: theme.background, borderColor: theme.border }]}><AppIcon name="person-outline" size={16} color={theme.secondaryText} /><TextInput value={draft.speaker} onChangeText={speaker => setDraft(current => ({ ...current, speaker }))} placeholder="Enter preacher’s name" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} /></View>
        <Text style={[styles.label, { color: theme.text }]}>Category</Text><View style={styles.categoryList}>{[{ id: '', name: 'All' }, ...categories].map(item => { const active = String(draft.category) === String(item.id); return <TouchableOpacity key={String(item.id)} onPress={() => setDraft(current => ({ ...current, category: String(item.id) }))} style={[styles.category, { backgroundColor: active ? theme.primary : theme.background, borderColor: active ? theme.primary : theme.border }]}><Text style={[styles.categoryText, { color: active ? '#FFFFFF' : theme.text }]}>{item.name}</Text></TouchableOpacity>; })}</View>
        <View style={styles.actions}><TouchableOpacity onPress={clearFilters} style={[styles.clearButton, { borderColor: theme.border }]}><Text style={[styles.actionText, { color: theme.text }]}>Clear</Text></TouchableOpacity><TouchableOpacity onPress={applyFilters} style={[styles.applyButton, { backgroundColor: theme.primary }]}><Text style={[styles.actionText, { color: '#FFFFFF' }]}>Apply filters</Text></TouchableOpacity></View>
        </ScrollView>
      </Pressable></Pressable>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 14 }, emptyContent: { flexGrow: 1 }, headerRow: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, resultLabel: { fontSize: 12, fontWeight: '700' }, filterButton: { height: 38, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, filterText: { fontSize: 12, fontWeight: '800' }, badge: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#111827', fontSize: 9, fontWeight: '900' }, card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, padding: 12, marginBottom: 9, gap: 10 }, playIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, title: { fontSize: 13, lineHeight: 18, fontWeight: '800' }, meta: { fontSize: 10, fontWeight: '700', marginTop: 3 }, description: { fontSize: 10, lineHeight: 15, marginTop: 4 }, engagement: { flexDirection: 'row', gap: 11, marginTop: 6 }, engagementItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, engagementText: { fontSize: 9, fontWeight: '700' }, playButton: { height: 34, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 }, playText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, loader: { paddingVertical: 30 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 70 }, emptyIcon: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 13 }, emptyText: { fontSize: 12, marginTop: 5 }, modalRoot: { flex: 1 }, backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' }, sheet: { maxHeight: '90%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 9, paddingBottom: 16 }, sheetContent: { paddingBottom: 14 }, handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 17 }, sheetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, sheetTitle: { fontSize: 19, fontWeight: '900' }, sheetSubtitle: { fontSize: 11, marginTop: 3 }, close: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 4 }, inputWrap: { height: 47, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 }, input: { flex: 1, height: 45, fontSize: 13 }, categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 20 }, category: { minHeight: 35, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }, categoryText: { fontSize: 11, fontWeight: '800' }, actions: { flexDirection: 'row', gap: 10 }, clearButton: { height: 48, flex: 0.38, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, applyButton: { height: 48, flex: 0.62, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, actionText: { fontSize: 13, fontWeight: '900' },
});
