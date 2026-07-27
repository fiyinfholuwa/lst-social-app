import React, { useState } from 'react';
        import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
        import apiService from '../../api/apiService';

        export default function CreatePostScreen({ navigation }) {
          const [content, setContent] = useState('');
          const [image, setImage] = useState(null);
          const { theme } = useTheme();
          const { user } = useAuth();

          const handleSubmit = async () => {
            if (!content.trim()) {
              Alert.alert('Error', 'Please write something');
              return;
            }
            if (!user) {
              Alert.alert('Authentication Required', 'Please log in.');
              return;
            }
            await apiService.createPost(content, image);
            Alert.alert('Success', 'Post created!');
            navigation.goBack();
          };

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
              />
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Post</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1, padding: 16 },
          input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, minHeight: 150, textAlignVertical: 'top' },
          button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
          buttonText: { color: '#fff', fontWeight: '600' },
        });
      