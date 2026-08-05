import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './AppIcon';
import { useTheme } from '../context/ThemeContext';

export default function ScreenHeader({ eyebrow, title, actionIcon, onAction, badgeCount = 0 }) {
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
          {badgeCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 },
  action: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 5, backgroundColor: '#D92D20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 9, lineHeight: 11, fontWeight: '700' },
});
