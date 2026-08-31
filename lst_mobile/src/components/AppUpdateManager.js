import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import AppIcon from './AppIcon';

const versionParts = version => String(version || '0').split('.').map(part => Number.parseInt(part, 10) || 0);

const isOlderThan = (current, target) => {
  const left = versionParts(current);
  const right = versionParts(target);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if ((left[index] || 0) < (right[index] || 0)) return true;
    if ((left[index] || 0) > (right[index] || 0)) return false;
  }
  return false;
};

export default function AppUpdateManager() {
  const { theme } = useTheme();
  const [update, setUpdate] = useState(null);
  const currentVersion = Constants.expoConfig?.version || '0.0.0';
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  useEffect(() => {
    let active = true;
    apiService.getAppVersion(platform).then(policy => {
      if (!active || !isOlderThan(currentVersion, policy.latestVersion)) return;
      setUpdate({ ...policy, required: isOlderThan(currentVersion, policy.minimumVersion) });
    }).catch(() => {});
    return () => { active = false; };
  }, [currentVersion, platform]);

  const openStore = async () => {
    try {
      await Linking.openURL(update.storeUrl);
    } catch {
      Alert.alert('Unable to open the store', 'Please open your app store and search for LST Social.');
    }
  };

  if (!update) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => { if (!update.required) setUpdate(null); }}>
      <Pressable style={styles.backdrop} onPress={() => { if (!update.required) setUpdate(null); }}>
        <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <AppIcon name="arrow-up" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>{update.required ? 'UPDATE REQUIRED' : 'UPDATE AVAILABLE'}</Text>
          <Text style={[styles.title, { color: theme.text }]}>A better LST Social is ready</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>{update.message}</Text>
          <Text style={[styles.version, { color: theme.secondaryText }]}>Version {currentVersion} → {update.latestVersion}</Text>
          <TouchableOpacity style={[styles.updateButton, { backgroundColor: theme.primary }]} onPress={openStore}>
            <Text style={styles.updateButtonText}>Update now</Text>
          </TouchableOpacity>
          {!update.required ? <TouchableOpacity style={styles.laterButton} onPress={() => setUpdate(null)}><Text style={[styles.laterText, { color: theme.secondaryText }]}>Maybe later</Text></TouchableOpacity> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 24, backgroundColor: 'rgba(10,12,18,0.68)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 410, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, padding: 24, alignItems: 'center' },
  icon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { marginTop: 8, fontSize: 23, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  message: { marginTop: 10, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  version: { marginTop: 14, fontSize: 12, fontWeight: '700' },
  updateButton: { width: '100%', height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  updateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  laterButton: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 },
  laterText: { fontSize: 13, fontWeight: '700' },
});
