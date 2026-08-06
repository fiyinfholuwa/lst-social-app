import React, { useState, useEffect } from 'react';
        import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
        import { useAuth } from '../../context/AuthContext';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import { useOnboarding } from '../../context/OnboardingContext';
import Icon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useFriendships } from '../../context/FriendshipsContext';

        export default function ProfileScreen({ navigation }) {
          const { user, logout } = useAuth();
          const { theme, isDark, toggleTheme } = useTheme();
          const [profile, setProfile] = useState(user);
          const { replayOnboarding } = useOnboarding();
          const { savedPostIds } = useSavedPosts();
          const { blockedUserIds, friendIds } = useFriendships();

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
              <Avatar uri={profile.avatar} size={120} style={styles.avatar} accessibilityLabel={`${profile.name}'s profile avatar`} />
              <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
              <Text style={[styles.email, { color: theme.secondaryText }]}>{profile.email}</Text>
              <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
              <View style={[styles.infoRow, { borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>Joined Communities:</Text>
                <Text style={[styles.value, { color: theme.secondaryText }]}>{profile.joinedCommunities?.length || 0}</Text>
              </View>

              <View style={[styles.themeRow, { borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: theme.primary }} />
              </View>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('SavedPosts')}>
                <Icon name="bookmark" size={18} strokeWidth={1.4} color={theme.primary} />
                <Text style={[styles.menuText, { color: theme.text }]}>Saved posts</Text>
                <Text style={[styles.menuValue, { color: theme.secondaryText }]}>{savedPostIds.length}</Text>
                <Icon name="chevron-forward" size={16} strokeWidth={1.4} color={theme.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('Friends')}>
                <Icon name="users" size={18} strokeWidth={1.4} color={theme.primary} />
                <Text style={[styles.menuText, { color: theme.text }]}>Friends</Text>
                <Text style={[styles.menuValue, { color: theme.secondaryText }]}>{friendIds.length}</Text>
                <Icon name="chevron-forward" size={16} strokeWidth={1.4} color={theme.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={replayOnboarding}>
                <Icon name="play-circle-outline" size={18} strokeWidth={1.4} color={theme.primary} />
                <Text style={[styles.menuText, { color: theme.text }]}>Replay welcome experience</Text>
                <Icon name="chevron-forward" size={16} strokeWidth={1.4} color={theme.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('BlockedAccounts')}>
                <Icon name="ban" size={18} strokeWidth={1.4} color={theme.danger} />
                <Text style={[styles.menuText, { color: theme.text }]}>Blocked accounts</Text>
                <Text style={[styles.menuValue, { color: theme.secondaryText }]}>{blockedUserIds.length}</Text>
                <Icon name="chevron-forward" size={16} strokeWidth={1.4} color={theme.secondaryText} />
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
          themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 12, borderTopWidth: 1 },
          menuRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, paddingVertical: 14, borderTopWidth: 1 },
          menuText: { flex: 1, fontSize: 15, fontWeight: '600' },
          menuValue: { fontSize: 13, fontWeight: '700' },
          logoutButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, marginTop: 24 },
          logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
        });
      
