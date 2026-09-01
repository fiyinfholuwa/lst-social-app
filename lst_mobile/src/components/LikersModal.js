import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';
import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';

export default function LikersModal({ visible, onClose, loadPage, navigation, title = 'Liked by' }) {
  const { theme } = useTheme();
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (requestedPage = 1) => {
    requestedPage === 1 ? setLoading(true) : setLoadingMore(true);
    setFailed(false);
    try {
      const response = await loadPage(requestedPage);
      setPeople(current => requestedPage === 1 ? response.data || [] : [...current, ...(response.data || [])]);
      setPage(response.currentPage || requestedPage);
      setHasMore(Boolean(response.hasMorePages));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadPage]);

  useEffect(() => {
    if (visible) load(1);
    else { setPeople([]); setPage(1); setHasMore(false); }
  }, [load, visible]);

  const openProfile = person => {
    onClose();
    navigation.navigate('UserProfile', { userId: person.id });
  };

  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity style={[styles.close, { backgroundColor: theme.background }]} onPress={onClose} accessibilityLabel="Close likes"><AppIcon name="times" size={17} color={theme.text} /></TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator style={styles.loading} color={theme.primary} /> : <FlatList
          data={people}
          keyExtractor={person => person.id}
          onEndReached={() => hasMore && !loadingMore && load(page + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<View style={styles.empty}><AppIcon name={failed ? 'alert-circle-outline' : 'heart'} size={26} color={theme.secondaryText} /><Text style={[styles.emptyText, { color: theme.secondaryText }]}>{failed ? 'Couldn’t load likes' : 'No likes yet'}</Text>{failed ? <TouchableOpacity onPress={() => load(1)}><Text style={[styles.retryText, { color: theme.primary }]}>Try again</Text></TouchableOpacity> : null}</View>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : null}
          renderItem={({ item }) => <TouchableOpacity style={[styles.person, { borderBottomColor: theme.border }]} onPress={() => openProfile(item)}><Avatar uri={item.avatar} size={46} accessibilityLabel={`${item.name}'s profile avatar`} /><Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text><AppIcon name="chevron-right" size={14} color={theme.secondaryText} /></TouchableOpacity>}
        />}
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { height: '68%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 9, paddingBottom: 20 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900' },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 70 },
  person: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { flex: 1, fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
  emptyText: { fontSize: 13, fontWeight: '700' },
  retryText: { fontSize: 12, fontWeight: '900', marginTop: 3 },
  footer: { paddingVertical: 18 },
});
