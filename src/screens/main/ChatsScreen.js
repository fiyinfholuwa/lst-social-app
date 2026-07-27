import React, { useState, useEffect } from 'react';
        import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';

        export default function ChatsScreen({ navigation }) {
          const [chats, setChats] = useState([]);
          const { theme } = useTheme();

          useEffect(() => { loadChats(); }, []);

          const loadChats = async () => {
            const data = await apiService.getChats();
            setChats(data);
          };

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ScreenHeader eyebrow="PRIVATE & SAFE" title="Messages" actionIcon="create-outline" />
              <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.chatItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, userName: item.withUser.name })}
                  >
                    <Image source={{ uri: item.withUser.avatar }} style={styles.avatar} />
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]}>{item.withUser.name}</Text>
                      <Text style={[styles.lastMsg, { color: theme.secondaryText }]}>{item.lastMessage}</Text>
                    </View>
                    <Text style={[styles.time, { color: theme.secondaryText }]}>{item.timestamp}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          chatItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10, marginHorizontal: 14 },
          avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
          info: { flex: 1 },
          name: { fontWeight: '600', fontSize: 16 },
          lastMsg: { fontSize: 14 },
          time: { fontSize: 12 },
        });
      
