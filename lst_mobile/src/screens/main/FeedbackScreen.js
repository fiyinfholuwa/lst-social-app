import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import { useTheme } from '../../context/ThemeContext';

const TYPES = [
  { value: 'support', label: 'Get help', description: 'Ask a question or request account support', icon: 'help-circle-outline' },
  { value: 'issue', label: 'Report issue', description: 'Tell us about something that is not working', icon: 'alert-circle-outline' },
  { value: 'feedback', label: 'Send feedback', description: 'Share an idea or suggestion with the team', icon: 'chatbubbles-outline' },
];

export default function FeedbackScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [type, setType] = useState(route.params?.type || 'support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Details required', 'Add a subject and message before sending.');
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert('Tell us a little more', 'Your message should contain at least 10 characters.');
      return;
    }

    setSending(true);
    try {
      const response = await apiService.submitSupportRequest(type, subject.trim(), message.trim());
      Alert.alert(
        'Message received',
        `Your request was sent to the support team. Reference: ${response.reference}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Could not send', error.message || 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={[styles.intro, { backgroundColor: theme.primarySoft }]}>
          <AppIcon name="shield-checkmark-outline" size={20} color={theme.primary} />
          <View style={styles.introCopy}><Text style={[styles.introTitle, { color: theme.primary }]}>We’re here to help</Text><Text style={[styles.introText, { color: theme.primary }]}>Your message is sent securely to the LST Social support team.</Text></View>
        </View>

        <Text style={[styles.label, { color: theme.secondaryText }]}>How can we help?</Text>
        <View style={styles.types}>
          {TYPES.map(option => {
            const selected = type === option.value;
            return <TouchableOpacity key={option.value} onPress={() => setType(option.value)} style={[styles.type, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.card }]}><View style={[styles.typeIcon, { backgroundColor: selected ? theme.card : theme.primarySoft }]}><AppIcon name={option.icon} size={17} color={theme.primary} /></View><View style={styles.typeCopy}><Text style={[styles.typeTitle, { color: theme.text }]}>{option.label}</Text><Text style={[styles.typeDescription, { color: theme.secondaryText }]}>{option.description}</Text></View>{selected ? <AppIcon name="check-circle" solid size={18} color={theme.primary} /> : null}</TouchableOpacity>;
          })}
        </View>

        <Text style={[styles.label, { color: theme.secondaryText }]}>Subject</Text>
        <TextInput value={subject} onChangeText={setSubject} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="Brief summary" placeholderTextColor={theme.secondaryText} maxLength={150} returnKeyType="next" />
        <Text style={[styles.counter, { color: theme.secondaryText }]}>{subject.length}/150</Text>

        <Text style={[styles.label, { color: theme.secondaryText }]}>Message</Text>
        <TextInput value={message} onChangeText={setMessage} style={[styles.input, styles.message, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} placeholder="Describe what happened or how we can help…" placeholderTextColor={theme.secondaryText} multiline maxLength={5000} textAlignVertical="top" />
        <Text style={[styles.counter, { color: theme.secondaryText }]}>{message.length}/5000</Text>

        <TouchableOpacity style={[styles.submit, { backgroundColor: theme.primary }]} onPress={submit} disabled={sending}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.submitText}>Send to support</Text><AppIcon name="paper-plane" size={16} color="#FFFFFF" /></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 42 }, intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, padding: 14, marginBottom: 22 }, introCopy: { flex: 1 }, introTitle: { fontSize: 13, fontWeight: '800' }, introText: { fontSize: 11, lineHeight: 16, marginTop: 3 }, label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }, types: { gap: 8, marginBottom: 22 }, type: { minHeight: 68, borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, typeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, typeCopy: { flex: 1 }, typeTitle: { fontSize: 12.5, fontWeight: '800' }, typeDescription: { fontSize: 10.5, lineHeight: 15, marginTop: 2 }, input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14 }, message: { minHeight: 170, paddingTop: 13 }, counter: { alignSelf: 'flex-end', fontSize: 9.5, marginTop: 5, marginBottom: 15 }, submit: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 }, submitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
