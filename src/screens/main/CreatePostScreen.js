import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
        import { useTheme } from '../../context/ThemeContext';
        import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import Icon from 'react-native-vector-icons/Ionicons';

const postTypes = [
  { key: 'update', label: 'Update', icon: 'create-outline' },
  { key: 'prayer', label: 'Prayer', icon: 'heart-outline' },
  { key: 'testimony', label: 'Testimony', icon: 'sparkles-outline' },
];

        export default function CreatePostScreen({ navigation }) {
          const [content, setContent] = useState('');
          const [image, setImage] = useState(null);
          const { theme } = useTheme();
          const { user } = useAuth();
          const [postType, setPostType] = useState('update');

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
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
              <Text style={[styles.heading, { color: theme.text }]}>Share with intention</Text>
              <Text style={[styles.subheading, { color: theme.secondaryText }]}>What kind of moment are you sharing?</Text>
              <View style={styles.types}>
                {postTypes.map(type => (
                  <TouchableOpacity key={type.key} onPress={() => setPostType(type.key)} style={[styles.type, { borderColor: theme.border }, postType === type.key && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                    <Icon name={type.icon} size={17} color={postType === type.key ? theme.primary : theme.secondaryText} />
                    <Text style={[styles.typeText, { color: postType === type.key ? theme.primary : theme.secondaryText }]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder={postType === 'prayer' ? 'How can the community pray with you?' : postType === 'testimony' ? 'Share what God has done...' : "What's on your heart?"}
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
              />
              <View style={styles.tools}>
                <TouchableOpacity style={[styles.tool, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Icon name="image-outline" size={20} color={theme.primary} />
                  <Text style={[styles.toolText, { color: theme.text }]}>Add photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tool, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Icon name="people-outline" size={20} color={theme.primary} />
                  <Text style={[styles.toolText, { color: theme.text }]}>Choose circle</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.note, { backgroundColor: theme.primarySoft }]}>
                <Icon name="shield-checkmark-outline" size={18} color={theme.primary} />
                <Text style={[styles.noteText, { color: theme.primary }]}>Lead with kindness. Your post will be visible to the LST community.</Text>
              </View>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Share post</Text>
              </TouchableOpacity>
            </ScrollView>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1 },
          content: { padding: 18, paddingBottom: 40 },
          heading: { fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
          subheading: { fontSize: 14, marginTop: 6, marginBottom: 18 },
          types: { flexDirection: 'row', gap: 8, marginBottom: 16 },
          type: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 999 },
          typeText: { fontWeight: '700', fontSize: 12 },
          input: { borderWidth: 1, borderRadius: 18, padding: 15, fontSize: 16, minHeight: 180, textAlignVertical: 'top' },
          tools: { flexDirection: 'row', gap: 10, marginTop: 12 },
          tool: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
          toolText: { fontSize: 13, fontWeight: '600' },
          note: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 14, marginTop: 16, alignItems: 'center' },
          noteText: { flex: 1, fontSize: 12, lineHeight: 17 },
          button: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
          buttonText: { color: '#fff', fontWeight: '600' },
        });
      
