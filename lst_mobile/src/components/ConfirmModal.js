import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';

export default function ConfirmModal({ visible, title, message, confirmLabel, cancelLabel = 'Go back', icon = 'times', loading = false, onCancel, onConfirm }) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !loading && onCancel?.()}>
      <Pressable style={styles.backdrop} onPress={() => !loading && onCancel?.()}>
        <Pressable style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
          <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
            <AppIcon name={icon} size={24} color={theme.danger} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border }]} onPress={onCancel} disabled={loading}>
              <Text style={[styles.cancelText, { color: theme.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: theme.danger }]} onPress={onConfirm} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,0.56)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 350, borderWidth: 1, borderRadius: 26, padding: 22, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 24 },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  message: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelButton: { flex: 1, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 13, fontWeight: '800' },
  confirmButton: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
