import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const filters = ['All', 'My circles', 'Relationships', 'Recovery', 'Singles'];
const filterKeys = { All: 'all', 'My circles': 'mine', Relationships: 'relationships', Recovery: 'recovery', Singles: 'singles' };
const filterIcons = { All: 'apps-outline', 'My circles': 'check-circle', Relationships: 'heart-outline', Recovery: 'leaf-outline', Singles: 'person-outline' };
const loadingRows = Array.from({ length: 5 }, (_, index) => ({ id: `loading-${index}` }));

const circleCategory = circle => {
  const text = `${circle.name || ''} ${circle.description || ''}`;
  if (/recovery|addiction|healing/i.test(text)) return 'Recovery';
  if (/marital|marriage|courtship|couples/i.test(text)) return 'Relationships';
  if (/single|purity|virgin/i.test(text)) return 'Singles';
  return 'Growth';
};

const compactCount = value => Number(value || 0).toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const CircleImage = ({ uri, style, theme, size = 22 }) => {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return <View style={[style, styles.imageFallback, { backgroundColor: theme.primarySoft }]}><AppIcon name="people-outline" size={size} color={theme.primary} /></View>;
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />;
};

const CommunitySkeleton = ({ theme }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const fill = theme.border;

  return (
    <Animated.View style={[styles.communityRow, { backgroundColor: theme.card, borderColor: theme.border, opacity }]}>
      <View style={[styles.skeletonImage, { backgroundColor: fill }]} />
      <View style={styles.communityInfo}>
        <View style={[styles.skeletonTitle, { backgroundColor: fill }]} />
        <View style={[styles.skeletonLine, { backgroundColor: fill }]} />
        <View style={[styles.skeletonLineShort, { backgroundColor: fill }]} />
        <View style={[styles.skeletonMeta, { backgroundColor: fill }]} />
      </View>
      <View style={[styles.skeletonChevron, { backgroundColor: fill }]} />
    </Animated.View>
  );
};

export default function CommunitiesScreen({ navigation }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, refreshUser } = useAuth();
  const joinedIds = Array.isArray(user?.joinedCommunities) ? user.joinedCommunities.map(String) : [];

  useFocusEffect(React.useCallback(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]));

  const loadCommunities = async (requestedPage = 1, refresh = false) => {
    if (refresh) setRefreshing(true); else if (requestedPage === 1) setLoading(true); else setLoadingMore(true);
    setLoadError(null);
    try {
      const response = await apiService.getCommunitiesPage(requestedPage, query.trim(), filterKeys[activeFilter]);
      setCommunities(current => requestedPage === 1 ? response.data : [...current, ...response.data.filter(item => !current.some(existing => existing.id === item.id))]);
      setPage(response.currentPage);
      setHasMore(Boolean(response.hasMorePages));
      setTotal(response.total || 0);
    } catch (error) {
      setLoadError(error.message || 'Unable to load communities.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadCommunities(1), query.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  const joinedCommunities = communities.filter(item => joinedIds.includes(item.id));
  const visibleCommunities = communities;

  const openCommunity = community => navigation.navigate('CommunityDetail', { communityId: community.id });

  const ListHeader = () => (
    <>
      <LinearGradient colors={[theme.primary, theme.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>FIND YOUR PEOPLE</Text>
          <Text style={styles.heroTitle}>Grow better together.</Text>
          <Text style={styles.heroText}>Discover supportive spaces built around shared seasons and goals.</Text>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{joinedIds.length}</Text><Text style={styles.heroStatLabel}>Joined</Text></View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{loading ? '—' : total}</Text><Text style={styles.heroStatLabel}>Available</Text></View>
        </View>
      </LinearGradient>

      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AppIcon name="search" size={16} color={theme.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or purpose"
          placeholderTextColor={theme.secondaryText}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <AppIcon name="times-circle" size={16} color={theme.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map(filter => {
          const selected = filter === activeFilter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.card }]}
            >
              <AppIcon name={filterIcons[filter]} size={13} color={selected ? theme.primary : theme.secondaryText} />
              <Text style={[styles.filterText, { color: selected ? theme.primary : theme.secondaryText }]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!query && activeFilter === 'All' && joinedCommunities.length > 0 ? (
        <View style={styles.joinedSection}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your circles</Text>
            <TouchableOpacity onPress={() => setActiveFilter('My circles')}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.joinedList}>
            {joinedCommunities.map(item => (
              <TouchableOpacity key={item.id} style={[styles.joinedCard, { backgroundColor: theme.primary }]} onPress={() => openCommunity(item)}>
                <CircleImage uri={item.image} style={styles.joinedImage} theme={theme} size={20} />
                <View style={styles.joinedCopy}>
                  <Text style={styles.joinedName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.joinedMeta}>{item.memberCount} members</Text>
                </View>
                <AppIcon name="arrow-right" size={13} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {activeFilter === 'My circles' ? 'Your communities' : 'Discover communities'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            {loading ? 'Loading circles…' : total === visibleCommunities.length ? `${total} ${total === 1 ? 'circle' : 'circles'}` : `Showing ${visibleCommunities.length} of ${total}`}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader eyebrow="BELONG & GROW" title="Circles" />
      <FlatList
        data={loading ? loadingRows : visibleCommunities}
        keyExtractor={item => item.id}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => loadCommunities(1, true)}
        onEndReached={() => hasMore && !loadingMore && loadCommunities(page + 1)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
        renderItem={({ item }) => {
          if (loading) return <CommunitySkeleton theme={theme} />;

          const joined = joinedIds.includes(item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.communityRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openCommunity(item)}
            >
              <CircleImage uri={item.image} style={styles.communityImage} theme={theme} />
              <View style={styles.communityInfo}>
                <View style={styles.nameLine}>
                  <Text style={[styles.communityName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  {joined ? <View style={[styles.memberBadge, { backgroundColor: theme.primarySoft }]}><AppIcon name="check" size={11} color={theme.primary} /><Text style={[styles.memberBadgeText, { color: theme.primary }]}>Joined</Text></View> : null}
                </View>
                <Text style={[styles.category, { color: theme.primary }]}>{circleCategory(item).toUpperCase()}</Text>
                <Text style={[styles.description, { color: theme.secondaryText }]} numberOfLines={2}>{item.description}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}><AppIcon name="users" size={11} color={theme.secondaryText} /><Text style={[styles.metaText, { color: theme.secondaryText }]}>{compactCount(item.memberCount)} members</Text></View>
                  <View style={styles.metaItem}><AppIcon name="comments" size={11} color={theme.secondaryText} /><Text style={[styles.metaText, { color: theme.secondaryText }]}>{compactCount(item.postCount)} posts</Text></View>
                </View>
              </View>
              <View style={[styles.cardArrow, { backgroundColor: theme.primarySoft }]}><AppIcon name="chevron-right" size={14} color={theme.primary} /></View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="search" size={26} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{loadError ? 'Could not load circles' : activeFilter === 'My circles' && !query ? 'You have not joined a circle yet' : 'No circles found'}</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{loadError || (activeFilter === 'My circles' && !query ? 'Explore the other categories and find a circle for you.' : 'Try a different search or category.')}</Text>
            {!loadError && (query || activeFilter !== 'All') ? <TouchableOpacity style={[styles.retry, { backgroundColor: theme.primarySoft }]} onPress={() => { setQuery(''); setActiveFilter('All'); }}><Text style={[styles.retryText, { color: theme.primary }]}>Clear filters</Text></TouchableOpacity> : null}
            {loadError ? <TouchableOpacity style={[styles.retry, { backgroundColor: theme.primary }]} onPress={loadCommunities}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { marginHorizontal: 14, marginBottom: 13, padding: 17, borderRadius: 21, flexDirection: 'row', alignItems: 'flex-end', overflow: 'hidden' },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 5 },
  heroText: { color: 'rgba(255,255,255,0.82)', fontSize: 11, lineHeight: 16, marginTop: 5 },
  heroStats: { minWidth: 76, padding: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.13)' },
  heroStat: { alignItems: 'center' },
  heroStatValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 8.5, marginTop: 1 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 7 },
  search: { marginHorizontal: 14, height: 48, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 13 },
  filters: { paddingHorizontal: 14, paddingVertical: 14, gap: 8 },
  filter: { minHeight: 36, paddingHorizontal: 13, borderWidth: 1, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterText: { fontSize: 11, fontWeight: '700' },
  joinedSection: { marginBottom: 6 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 10, marginBottom: 11 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionSubtitle: { fontSize: 11, marginTop: 3 },
  seeAll: { fontSize: 12, fontWeight: '700' },
  joinedList: { paddingHorizontal: 14, gap: 10 },
  joinedCard: { width: 210, minHeight: 88, padding: 11, borderRadius: 17, flexDirection: 'row', alignItems: 'center' },
  joinedImage: { width: 52, height: 52, borderRadius: 14, marginRight: 10 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  joinedCopy: { flex: 1 },
  joinedName: { color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '700' },
  joinedMeta: { color: 'rgba(255,255,255,0.82)', fontSize: 11, marginTop: 4 },
  communityRow: { marginHorizontal: 14, marginBottom: 10, padding: 12, borderWidth: 1, borderRadius: 19, flexDirection: 'row', alignItems: 'center' },
  communityImage: { width: 74, height: 82, borderRadius: 16, marginRight: 12 },
  skeletonImage: { width: 66, height: 66, borderRadius: 14, marginRight: 12 },
  skeletonTitle: { width: '52%', height: 12, borderRadius: 6 },
  skeletonLine: { width: '92%', height: 9, borderRadius: 5, marginTop: 8 },
  skeletonLineShort: { width: '68%', height: 9, borderRadius: 5, marginTop: 5 },
  skeletonMeta: { width: '45%', height: 9, borderRadius: 5, marginTop: 9 },
  skeletonChevron: { width: 8, height: 14, borderRadius: 4, marginLeft: 8 },
  communityInfo: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  communityName: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  memberBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 2 },
  memberBadgeText: { fontSize: 8.5, fontWeight: '900' },
  category: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, marginTop: 3 },
  description: { fontSize: 11, lineHeight: 15, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { maxWidth: 105, fontSize: 11 },
  metaDot: { fontSize: 11 },
  cardArrow: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 12, marginTop: 5 },
  retry: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  footer: { paddingVertical: 18 },
});
