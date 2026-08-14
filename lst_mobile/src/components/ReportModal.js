import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';
import KeyboardSafeView from './KeyboardSafeView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REASONS = [
  ['harassment', 'Harassment or bullying'],
  ['hate', 'Hate or discrimination'],
  ['sexual_content', 'Sexual or inappropriate content'],
  ['violence', 'Violence or threats'],
  ['spam', 'Spam or scam'],
  ['impersonation', 'Impersonation'],
  ['privacy', 'Privacy violation'],
  ['self_harm', 'Self-harm concern'],
  ['other', 'Something else'],
];

export default function ReportModal({ visible, targetType, targetId, targetName, onClose }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setReason('');
    setDetails('');
    setError('');
  }, [visible, targetId]);

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await apiService.submitReport(targetType, targetId, reason, details.trim());
      onClose?.({ submitted: true });
    } catch (submitError) {
      setError(submitError.message || 'The report could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !submitting && onClose?.()}>
      <KeyboardSafeView>
        <Pressable style={styles.backdrop} onPress={() => !submitting && onClose?.()}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: Math.max(insets.bottom + 20, 36) }]} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}><AppIcon name="flag" size={22} color={theme.danger} /></View>
            <Text style={[styles.title, { color: theme.text }]}>Report {targetName || targetType}</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Choose the reason that best describes the problem. Reports are private and reviewed by the moderation team.</Text>
            <ScrollView style={styles.reasons} keyboardShouldPersistTaps="handled">
              {REASONS.map(([value, label]) => (
                <TouchableOpacity key={value} style={[styles.reason, { borderColor: reason === value ? theme.primary : theme.border, backgroundColor: reason === value ? theme.primarySoft : theme.background }]} onPress={() => setReason(value)}>
                  <View style={[styles.radio, { borderColor: reason === value ? theme.primary : theme.border }]}>{reason === value ? <View style={[styles.radioInner, { backgroundColor: theme.primary }]} /> : null}</View>
                  <Text style={[styles.reasonText, { color: theme.text }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Add details for the moderator (optional)"
              placeholderTextColor={theme.secondaryText}
              maxLength={1000}
              multiline
              style={[styles.details, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            />
            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.cancel, { borderColor: theme.border }]} onPress={() => onClose?.()} disabled={submitting}><Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submit, { backgroundColor: reason ? theme.danger : theme.border }]} onPress={submit} disabled={!reason || submitting}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit report</Text>}</TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,17,24,0.62)' },
  sheet: { maxHeight: '92%', borderWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#B8AAB2', alignSelf: 'center', marginBottom: 15 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 13 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  reasons: { marginTop: 16, maxHeight: 285 },
  reason: { minHeight: 45, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioInner: { width: 9, height: 9, borderRadius: 5 },
  reasonText: { fontSize: 13, fontWeight: '700' },
  details: { minHeight: 76, maxHeight: 110, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top', fontSize: 12, marginTop: 9 },
  error: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  cancel: { flex: 1, height: 50, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, fontWeight: '800' },
  submit: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
