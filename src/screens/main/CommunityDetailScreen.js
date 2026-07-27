import React, { useState, useEffect } from 'react';
        import { View, Text, FlatList, StyleSheet } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import apiService from '../../api/apiService';

        export default function CommunityDetailScreen({ route }) {
          const { communityId } = route.params;
          const [community, setCommunity] = useState(null);
          const { theme } = useTheme();

          useEffect(() => { loadCommunity(); }, []);

          const loadCommunity = async () => {
            const data = await apiService.getCommunity(communityId);
            setCommunity(data);
          };

          if (!community) return null;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <Text style={[styles.title, { color: theme.text }]}>{community.name}</Text>
              <Text style={[styles.desc, { color: theme.secondaryText }]}>{community.description}</Text>
              <Text style={[styles.rules, { color: theme.secondaryText }]}>Rules: {community.rules}</Text>
              <Text style={[styles.admin, { color: theme.secondaryText }]}>Admin: {community.admin}</Text>
              <Text style={[styles.postHeader, { color: theme.text }]}>Community Posts</Text>
              <FlatList
                data={community.posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.postItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.postContent, { color: theme.text }]}>{item.content}</Text>
                    <Text style={[styles.postTime, { color: theme.secondaryText }]}>{item.timestamp}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ color: theme.secondaryText, marginTop: 20 }}>No posts yet.</Text>}
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1, padding: 16 },
          title: { fontSize: 22, fontWeight: '700' },
          desc: { fontSize: 14, marginVertical: 4 },
          rules: { fontSize: 14, fontStyle: 'italic', marginVertical: 4 },
          admin: { fontSize: 14, marginVertical: 4 },
          postHeader: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
          postItem: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
          postContent: { fontSize: 14 },
          postTime: { fontSize: 12, marginTop: 4 },
        });
      