import React, { useState, useEffect } from 'react';
        import { View, Text, Image, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
        import { useAuth } from '../../context/AuthContext';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import { useOnboarding } from '../../context/OnboardingContext';
import Icon from 'react-native-vector-icons/Ionicons';

        export default function ProfileScreen() {
          const { user, logout } = useAuth();
          const { theme, isDark, toggleTheme } = useTheme();
          const [profile, setProfile] = useState(user);
          const { replayOnboarding } = useOnboarding();

          useEffect(() => { loadProfile(); }, []);

          const loadProfile = async () => {
            const data = await apiService.getUserProfile();
            setProfile(data);
          };

          const handleLogout = () => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', onPress: logout },
            ]);
          };

          if (!profile) return null;

          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ScreenHeader eyebrow="YOUR SPACE" title="Profile" actionIcon="settings-outline" />
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
              <Text style={[styles.email, { color: theme.secondaryText }]}>{profile.email}</Text>
              <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
              <View style={[styles.infoRow, { borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>Joined Communities:</Text>
                <Text style={[styles.value, { color: theme.secondaryText }]}>{profile.joinedCommunities?.length || 0}</Text>
              </View>

              <View style={styles.themeRow}>
                <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: theme.primary }} />
              </View>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={replayOnboarding}>
                <Icon name="play-circle-outline" size={21} color={theme.primary} />
                <Text style={[styles.menuText, { color: theme.text }]}>Replay welcome experience</Text>
                <Icon name="chevron-forward" size={18} color={theme.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
          avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
          name: { fontSize: 24, fontWeight: '700' },
          email: { fontSize: 16, marginBottom: 8 },
          bio: { fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginBottom: 16 },
          infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderTopWidth: 1, marginBottom: 8 },
          label: { fontSize: 16 },
          value: { fontSize: 16 },
          themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#e1e1e1' },
          menuRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, paddingVertical: 14, borderTopWidth: 1 },
          menuText: { flex: 1, fontSize: 15, fontWeight: '600' },
          logoutButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, marginTop: 24 },
          logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
        });
      
