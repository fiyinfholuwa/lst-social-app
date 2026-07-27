import React, { useState, useEffect } from 'react';
        import { View, FlatList, StyleSheet, TouchableOpacity, Text, Image, Alert } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';

        export default function CommunitiesScreen({ navigation }) {
          const [communities, setCommunities] = useState([]);
          const { theme } = useTheme();
          const { user } = useAuth();

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

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <FlatList data={communities} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ padding: 12 }} />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          card: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 10, overflow: 'hidden' },
          image: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
          info: { flex: 1, justifyContent: 'space-between' },
          name: { fontWeight: '600', fontSize: 16 },
          desc: { fontSize: 13, marginVertical: 2 },
          rules: { fontSize: 12, fontStyle: 'italic' },
          members: { fontSize: 12 },
          joinButton: { padding: 6, borderRadius: 6, alignItems: 'center', marginTop: 4 },
          joinText: { color: '#fff', fontWeight: '600', fontSize: 12 },
        });
      