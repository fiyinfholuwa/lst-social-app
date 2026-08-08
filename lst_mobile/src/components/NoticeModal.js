import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';

export default function NoticeModal({ visible, title, message, buttonLabel = 'Got it', tone = 'warning', onClose }) {
  const { theme } = useTheme();
  const success = tone === 'success';
  const color = success ? '#15803D' : theme.primary;
  const softColor = success ? '#EAF8EF' : theme.primarySoft;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
          <View style={[styles.icon, { backgroundColor: softColor }]}>
            <AppIcon name={success ? 'check-circle' : 'information-circle-outline'} size={27} color={color} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,0.56)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 350, borderWidth: 1, borderRadius: 26, padding: 22, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 24 },
  icon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  message: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  button: { width: '100%', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
