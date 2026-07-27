import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Image, Alert, TextInput } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import Icon from 'react-native-vector-icons/Ionicons';

        export default function CommunitiesScreen({ navigation }) {
          const [communities, setCommunities] = useState([]);
          const { theme } = useTheme();
          const { user } = useAuth();
          const [query, setQuery] = useState('');

          useEffect(() => { loadCommunities(); }, []);

          const loadCommunities = async () => {
            const data = await apiService.getCommunities();
            setCommunities(data);
          };

          const joinCommunity = async (id) => {
            if (!user) {
              Alert.alert('Please login first');
              return;
            }
            await apiService.joinCommunity(id);
            loadCommunities();
          };

          const renderItem = ({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.desc, { color: theme.secondaryText }]}>{item.description}</Text>
                <Text style={[styles.rules, { color: theme.secondaryText }]}>📜 {item.rules}</Text>
                <Text style={[styles.members, { color: theme.secondaryText }]}>👥 {item.memberCount} members</Text>
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: theme.primary }]}
                  onPress={() => joinCommunity(item.id)}
                >
                  <Text style={styles.joinText}>Join Community</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );

          const visibleCommunities = communities.filter(item =>
            `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())
          );

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ScreenHeader eyebrow="GROW TOGETHER" title="Find your circle" actionIcon="add" />
              <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon name="search-outline" size={19} color={theme.secondaryText} />
                <TextInput value={query} onChangeText={setQuery} placeholder="Search communities" placeholderTextColor={theme.secondaryText} style={[styles.searchInput, { color: theme.text }]} />
              </View>
              <Text style={[styles.resultLabel, { color: theme.secondaryText }]}>{visibleCommunities.length} PURPOSEFUL COMMUNITIES</Text>
              <FlatList data={visibleCommunities} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20 }} />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          search: { marginHorizontal: 14, marginBottom: 12, height: 50, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
          searchInput: { flex: 1, fontSize: 14 },
          resultLabel: { marginHorizontal: 17, marginBottom: 10, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
          card: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, marginBottom: 12, padding: 12, overflow: 'hidden' },
          image: { width: 84, height: 84, borderRadius: 14, marginRight: 12 },
          info: { flex: 1, justifyContent: 'space-between' },
          name: { fontWeight: '600', fontSize: 16 },
          desc: { fontSize: 13, marginVertical: 2 },
          rules: { fontSize: 12, fontStyle: 'italic' },
          members: { fontSize: 12 },
          joinButton: { padding: 8, borderRadius: 10, alignItems: 'center', marginTop: 7 },
          joinText: { color: '#fff', fontWeight: '600', fontSize: 12 },
        });
      
