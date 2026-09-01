import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';

const CACHE_PREFIX = 'sermons:list:v1:';
const EMPTY_FILTERS = { query: '', title: '', speaker: '', category: '' };

const SermonSkeleton = ({ theme }) => {
  const opacity = React.useRef(new Animated.Value(0.42)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 680, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.42, duration: 680, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={{ opacity }}>
    {[0, 1, 2, 3, 4].map(item => <View key={item} style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.skeletonPlay, { backgroundColor: theme.border }]} />
      <View style={styles.skeletonCopy}><View style={[styles.skeletonTitle, { backgroundColor: theme.border }]} /><View style={[styles.skeletonMeta, { backgroundColor: theme.border }]} /><View style={[styles.skeletonLine, { backgroundColor: theme.border }]} /></View>
      <View style={[styles.skeletonButton, { backgroundColor: theme.border }]} />
    </View>)}
  </Animated.View>;
};

export default function SermonsScreen({ navigation }) {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [quickSearch, setQuickSearch] = useState('');
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

  useEffect(() => {
    const timer = setTimeout(() => setFilters(current => ({ ...current, query: quickSearch.trim() })), 350);
    return () => clearTimeout(timer);
  }, [quickSearch]);

  useFocusEffect(useCallback(() => { loadSermons(1, { silent: true }); }, [loadSermons]));

  const refresh = async () => { setRefreshing(true); await loadSermons(1, { silent: true }); setRefreshing(false); };
  const openFilters = () => { setDraft(filters); setFilterVisible(true); };
  const applyFilters = () => { setFilters(draft); setFilterVisible(false); };
  const clearFilters = () => {
    const cleared = { ...EMPTY_FILTERS, query: filters.query };
    setDraft(cleared); setFilters(cleared); setFilterVisible(false);
  };
  const playSermon = sermon => navigation.navigate('SermonDetail', { sermonId: sermon.id });

  const Header = () => <View>
    <View style={styles.searchRow}>
      <View style={[styles.quickSearch, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AppIcon name="search" size={18} color={theme.secondaryText} />
        <TextInput value={quickSearch} onChangeText={setQuickSearch} placeholder="Search sermons or speakers" placeholderTextColor={theme.secondaryText} returnKeyType="search" style={[styles.quickSearchInput, { color: theme.text }]} />
        {quickSearch ? <TouchableOpacity onPress={() => setQuickSearch('')} accessibilityLabel="Clear search"><AppIcon name="times-circle" size={18} color={theme.secondaryText} /></TouchableOpacity> : null}
      </View>
      <TouchableOpacity onPress={openFilters} style={[styles.filterButton, { backgroundColor: activeFilterCount ? theme.primary : theme.card, borderColor: activeFilterCount ? theme.primary : theme.border }]} accessibilityLabel="Filter sermons">
        <AppIcon name="filter" size={18} color={activeFilterCount ? '#FFFFFF' : theme.text} />
        {activeFilterCount ? <View style={styles.badge}><Text style={styles.badgeText}>{activeFilterCount}</Text></View> : null}
      </TouchableOpacity>
    </View>
  </View>;

  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScreenHeader eyebrow="WATCH AND GROW" title="Sermons" />
    <FlatList data={sermons} keyExtractor={item => item.id} ListHeaderComponent={<Header />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />} contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }, !sermons.length && styles.emptyContent]} onEndReached={() => hasMore && !loadingMore && loadSermons(page + 1)} onEndReachedThreshold={0.4} ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : null} ListEmptyComponent={loading ? <SermonSkeleton theme={theme} /> : <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play-circle-outline" size={27} color={theme.primary} /></View><Text style={[styles.emptyTitle, { color: theme.text }]}>No sermons found</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Try changing or clearing the filters.</Text></View>} renderItem={({ item }) => <TouchableOpacity activeOpacity={0.76} onPress={() => playSermon(item)} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.playIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play" size={18} color={theme.primary} /></View><View style={styles.copy}>{item.category?.name ? <View style={[styles.categoryBadge, { backgroundColor: theme.primarySoft }]}><Text numberOfLines={1} style={[styles.categoryBadgeText, { color: theme.primary }]}>{item.category.name}</Text></View> : null}<Text numberOfLines={2} ellipsizeMode="tail" style={[styles.title, { color: theme.text }]}>{item.title}</Text><View style={styles.byline}><AppIcon name="person-outline" size={12} color={theme.secondaryText} /><Text numberOfLines={1} ellipsizeMode="tail" style={[styles.speaker, { color: theme.secondaryText }]}>{item.speaker || 'LST Ministry'}</Text></View>{item.description ? <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.description, { color: theme.secondaryText }]}>{item.description}</Text> : null}</View><View style={[styles.cardArrow, { backgroundColor: theme.primarySoft }]}><AppIcon name="chevron-right" size={14} color={theme.primary} /></View></TouchableOpacity>} />
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
  skeletonCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, padding: 12, marginBottom: 9, gap: 10 },
  skeletonPlay: { width: 42, height: 42, borderRadius: 14 },
  skeletonCopy: { flex: 1, gap: 7 },
  skeletonTitle: { width: '72%', height: 12, borderRadius: 6 },
  skeletonMeta: { width: '48%', height: 8, borderRadius: 4 },
  skeletonLine: { width: '88%', height: 8, borderRadius: 4 },
  skeletonButton: { width: 55, height: 34, borderRadius: 11 },
  screen: { flex: 1 }, content: { paddingHorizontal: 14 }, emptyContent: { flexGrow: 1 }, searchRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 9 }, quickSearch: { flex: 1, height: 48, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, quickSearchInput: { flex: 1, height: 46, fontSize: 13 }, filterButton: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#111827', fontSize: 9, fontWeight: '900' }, card: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 10, gap: 11 }, playIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, categoryBadge: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 20, marginBottom: 5, paddingHorizontal: 8, borderRadius: 10, justifyContent: 'center' }, categoryBadgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: .35, textTransform: 'uppercase' }, title: { fontSize: 14, lineHeight: 19, fontWeight: '900' }, byline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }, speaker: { flex: 1, fontSize: 10.5, lineHeight: 14, fontWeight: '700' }, description: { fontSize: 11, lineHeight: 16, marginTop: 7 }, cardArrow: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, loader: { paddingVertical: 30 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 70 }, emptyIcon: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 13 }, emptyText: { fontSize: 12, marginTop: 5 }, modalRoot: { flex: 1 }, backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' }, sheet: { maxHeight: '90%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 9, paddingBottom: 16 }, sheetContent: { paddingBottom: 14 }, handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 17 }, sheetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, sheetTitle: { fontSize: 19, fontWeight: '900' }, sheetSubtitle: { fontSize: 11, marginTop: 3 }, close: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 4 }, inputWrap: { height: 47, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 }, input: { flex: 1, height: 45, fontSize: 13 }, categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 20 }, category: { minHeight: 35, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }, categoryText: { fontSize: 11, fontWeight: '800' }, actions: { flexDirection: 'row', gap: 10 }, clearButton: { height: 48, flex: 0.38, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, applyButton: { height: 48, flex: 0.62, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, actionText: { fontSize: 13, fontWeight: '900' },
});
