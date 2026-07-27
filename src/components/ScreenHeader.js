import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './AppIcon';
import { useTheme } from '../context/ThemeContext';

export default function ScreenHeader({ eyebrow, title, actionIcon, onAction }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      {actionIcon ? (
        <TouchableOpacity style={[styles.action, { backgroundColor: theme.primarySoft }]} onPress={onAction}>
          <Icon name={actionIcon} size={21} color={theme.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  action: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
