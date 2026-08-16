import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';

export default function SermonsScreen() {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadSermons = useCallback(async (requestedPage = 1) => {
    if (requestedPage === 1) setLoading(true); else setLoadingMore(true);
    try {
      const response = await apiService.getSermons(query.trim(), selectedCategory, requestedPage);
      setCategories(response.categories || []);
      setSermons(current => requestedPage === 1 ? response.data || [] : [...current, ...(response.data || [])]);
      setPage(response.currentPage || requestedPage);
      setHasMore(Boolean(response.hasMorePages));
    } catch (error) {
      Alert.alert('Couldn’t load sermons', error.message || 'Please try again.');
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => loadSermons(1), 300);
    return () => clearTimeout(timer);
  }, [loadSermons]);

  const playSermon = async sermon => {
    const url = sermon.url?.trim();
    if (!/^https?:\/\//i.test(url || '')) return Alert.alert('Link unavailable', 'This sermon does not have a valid link.');
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Couldn’t open sermon', 'No installed app or browser could open this link.');
    }
  };

  const Header = () => <>
    <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}><AppIcon name="search" size={18} color={theme.secondaryText} /><TextInput value={query} onChangeText={setQuery} placeholder="Search sermon title or speaker" placeholderTextColor={theme.secondaryText} style={[styles.searchInput, { color: theme.text }]} /></View>
    <FlatList horizontal data={[{ id: '', name: 'All' }, ...categories]} keyExtractor={item => String(item.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} renderItem={({ item }) => { const active = String(selectedCategory) === String(item.id); return <TouchableOpacity onPress={() => setSelectedCategory(String(item.id))} style={[styles.category, { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.border }]}><Text style={[styles.categoryText, { color: active ? '#FFFFFF' : theme.text }]}>{item.name}</Text></TouchableOpacity>; }} />
  </>;

  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScreenHeader eyebrow="WATCH AND GROW" title="Sermons" />
    <FlatList
      data={sermons}
      keyExtractor={item => item.id}
      ListHeaderComponent={<Header />}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }, !sermons.length && styles.emptyContent]}
      onEndReached={() => hasMore && !loadingMore && loadSermons(page + 1)}
      onEndReachedThreshold={0.4}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : null}
      ListEmptyComponent={loading ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play-circle-outline" size={27} color={theme.primary} /></View><Text style={[styles.emptyTitle, { color: theme.text }]}>No sermons found</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Try another title or category.</Text></View>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.playIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="play" size={18} color={theme.primary} /></View><View style={styles.copy}><Text style={[styles.title, { color: theme.text }]}>{item.title}</Text><Text style={[styles.meta, { color: theme.primary }]}>{[item.category?.name, item.speaker].filter(Boolean).join(' · ')}</Text>{item.description ? <Text numberOfLines={2} style={[styles.description, { color: theme.secondaryText }]}>{item.description}</Text> : null}</View><TouchableOpacity style={[styles.playButton, { backgroundColor: theme.primary }]} onPress={() => playSermon(item)} accessibilityRole="link" accessibilityLabel={`Play ${item.title}`}><AppIcon name="play" size={12} color="#FFFFFF" /><Text style={styles.playText}>Play</Text></TouchableOpacity></View>}
    />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 14 }, emptyContent: { flexGrow: 1 }, search: { height: 48, marginTop: 12, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, height: 46, fontSize: 13 }, categories: { paddingVertical: 11, gap: 7 }, category: { height: 34, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, categoryText: { fontSize: 11, fontWeight: '800' }, card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, padding: 12, marginBottom: 9, gap: 10 }, playIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, title: { fontSize: 13, lineHeight: 18, fontWeight: '800' }, meta: { fontSize: 10, fontWeight: '700', marginTop: 3 }, description: { fontSize: 10, lineHeight: 15, marginTop: 4 }, playButton: { height: 34, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 }, playText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, loader: { paddingVertical: 30 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 70 }, emptyIcon: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 13 }, emptyText: { fontSize: 12, marginTop: 5 },
});
