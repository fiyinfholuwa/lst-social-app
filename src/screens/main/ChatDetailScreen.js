import React, { useState, useEffect } from 'react';
        import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';

        export default function ChatDetailScreen({ route }) {
          const { chatId, userName } = route.params;
          const [messages, setMessages] = useState([]);
          const [inputText, setInputText] = useState('');
          const { theme } = useTheme();
          const { user } = useAuth();

          useEffect(() => { loadMessages(); }, []);

          const loadMessages = async () => {
            const data = await apiService.getMessages(chatId);
            setMessages(data);
          };

          const sendMessage = async () => {
            if (!inputText.trim()) return;
            await apiService.sendMessage(chatId, inputText);
            setInputText('');
            loadMessages();
          };

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.messageRow, item.senderId === user.id ? styles.myMessage : styles.otherMessage]}>
                    <View style={[styles.bubble, { backgroundColor: item.senderId === user.id ? theme.primary : theme.card }]}>
                      <Text style={[styles.messageText, { color: item.senderId === user.id ? '#fff' : theme.text }]}>
                        {item.text}
                      </Text>
                      <Text style={[styles.messageTime, { color: item.senderId === user.id ? '#ddd' : theme.secondaryText }]}>
                        {item.timestamp}
                      </Text>
                    </View>
                  </View>
                )}
                inverted
              />
              <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  placeholder="Type a message..."
                  placeholderTextColor={theme.secondaryText}
                  value={inputText}
                  onChangeText={setInputText}
                />
                <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={sendMessage}>
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1, padding: 12 },
          messageRow: { marginVertical: 4, flexDirection: 'row' },
          myMessage: { justifyContent: 'flex-end' },
          otherMessage: { justifyContent: 'flex-start' },
          bubble: { maxWidth: '75%', padding: 10, borderRadius: 12, marginVertical: 2 },
          messageText: { fontSize: 14 },
          messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
          inputRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 8 },
          input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginRight: 8 },
          sendButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
          sendText: { color: '#fff', fontWeight: '600' },
        });
      