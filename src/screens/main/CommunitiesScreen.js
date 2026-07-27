import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const filters = ['All', 'My circles', 'Relationships', 'Recovery', 'Singles'];

const matchesFilter = (community, filter, joinedIds) => {
  if (filter === 'My circles') return joinedIds.includes(community.id);
  if (filter === 'Relationships') return /marital|marriage|courtship|couples/i.test(`${community.name} ${community.description}`);
  if (filter === 'Recovery') return /recovery|addiction|healing/i.test(`${community.name} ${community.description}`);
  if (filter === 'Singles') return /single|purity|virgin/i.test(`${community.name} ${community.description}`);
  return true;
};

export default function CommunitiesScreen({ navigation }) {
  const [communities, setCommunities] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { theme } = useTheme();
  const { user } = useAuth();
  const joinedIds = user?.joinedCommunities || [];

  useEffect(() => {
    apiService.getCommunities().then(setCommunities);
  }, []);

  const joinedCommunities = communities.filter(item => joinedIds.includes(item.id));
  const visibleCommunities = useMemo(() => communities.filter(item => {
    const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch && matchesFilter(item, activeFilter, joinedIds);
  }), [communities, query, activeFilter, joinedIds]);

  const openCommunity = community => navigation.navigate('CommunityDetail', { communityId: community.id });

  const ListHeader = () => (
    <>
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
              style={[styles.filter, { borderColor: theme.border }, selected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            >
              <Text style={[styles.filterText, { color: selected ? '#FFFFFF' : theme.secondaryText }]}>{filter}</Text>
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
                <Image source={{ uri: item.image }} style={styles.joinedImage} />
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
            {visibleCommunities.length} {visibleCommunities.length === 1 ? 'circle' : 'circles'}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader eyebrow="BELONG & GROW" title="Communities" actionIcon="user-plus" />
      <FlatList
        data={visibleCommunities}
        keyExtractor={item => item.id}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const joined = joinedIds.includes(item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.communityRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => openCommunity(item)}
            >
              <Image source={{ uri: item.image }} style={styles.communityImage} />
              <View style={styles.communityInfo}>
                <View style={styles.nameLine}>
                  <Text style={[styles.communityName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  {joined ? <AppIcon name="check-circle" size={13} color={theme.primary} /> : null}
                </View>
                <Text style={[styles.description, { color: theme.secondaryText }]} numberOfLines={2}>{item.description}</Text>
                <View style={styles.metaRow}>
                  <AppIcon name="users" size={11} color={theme.secondaryText} />
                  <Text style={[styles.metaText, { color: theme.secondaryText }]}>{item.memberCount} members</Text>
                  <Text style={[styles.metaDot, { color: theme.secondaryText }]}>•</Text>
                  <Text style={[styles.metaText, { color: theme.secondaryText }]} numberOfLines={1}>
                    {joined ? 'Member' : 'Application required'}
                  </Text>
                </View>
              </View>
              <AppIcon name="chevron-right" size={14} color={theme.secondaryText} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="search" size={26} color={theme.secondaryText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No communities found</Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Try a different search or category.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  search: { marginHorizontal: 14, height: 48, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 13 },
  filters: { paddingHorizontal: 14, paddingVertical: 14, gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 999 },
  filterText: { fontSize: 11, fontWeight: '700' },
  joinedSection: { marginBottom: 6 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 10, marginBottom: 11 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionSubtitle: { fontSize: 11, marginTop: 3 },
  seeAll: { fontSize: 12, fontWeight: '700' },
  joinedList: { paddingHorizontal: 14, gap: 10 },
  joinedCard: { width: 210, minHeight: 88, padding: 11, borderRadius: 17, flexDirection: 'row', alignItems: 'center' },
  joinedImage: { width: 52, height: 52, borderRadius: 14, marginRight: 10 },
  joinedCopy: { flex: 1 },
  joinedName: { color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  joinedMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 },
  communityRow: { marginHorizontal: 14, marginBottom: 9, padding: 11, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center' },
  communityImage: { width: 66, height: 66, borderRadius: 14, marginRight: 12 },
  communityInfo: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  communityName: { flexShrink: 1, fontSize: 13, fontWeight: '800' },
  description: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 5 },
  metaText: { maxWidth: 90, fontSize: 10 },
  metaDot: { fontSize: 9 },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyText: { fontSize: 12, marginTop: 5 },
});
