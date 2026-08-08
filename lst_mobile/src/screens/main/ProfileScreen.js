import React, { useState, useEffect } from 'react';
        import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
        import { useAuth } from '../../context/AuthContext';
        import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';
import ScreenHeader from '../../components/ScreenHeader';
import Icon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useFriendships } from '../../context/FriendshipsContext';

        export default function ProfileScreen({ navigation }) {
          const { user, logout } = useAuth();
          const { theme, isDark, toggleTheme } = useTheme();
          const [profile, setProfile] = useState(user);
          const [verifying, setVerifying] = useState(false);
          const { savedPostIds } = useSavedPosts();
          const { blockedUserIds, friendIds } = useFriendships();

          useEffect(() => {
            loadProfile();
            return navigation.addListener('focus', loadProfile);
          }, [navigation]);

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

          const verifyEmail = async () => {
            setVerifying(true);
            try {
              const response = await apiService.sendEmailVerification();
              Alert.alert('Check your email', response.message);
            } catch (error) {
              Alert.alert('Could not send verification', error.message);
            } finally { setVerifying(false); }
          };

          if (!profile) return null;

          return (
            <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
              <ScreenHeader eyebrow="YOUR SPACE" title="My profile" actionIcon="create-outline" onAction={() => navigation.navigate('EditProfile')} />
              <Avatar uri={profile.avatar} size={120} style={styles.avatar} accessibilityLabel={`${profile.name}'s profile avatar`} />
              <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
              <Text style={[styles.email, { color: theme.secondaryText }]}>{profile.email}</Text>
              {!profile.emailVerified ? <TouchableOpacity style={[styles.verifyButton, { backgroundColor: theme.accentSoft }]} onPress={verifyEmail} disabled={verifying}><Icon name="mail-outline" size={15} color={theme.accent} /><Text style={[styles.verifyText, { color: theme.accent }]}>{verifying ? 'Sending…' : 'Verify email address'}</Text></TouchableOpacity> : <View style={styles.verified}><Icon name="check-circle" size={14} color={theme.primary} /><Text style={[styles.verifiedText, { color: theme.primary }]}>Email verified</Text></View>}
              <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
              <TouchableOpacity style={[styles.editProfile, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('EditProfile')}><Icon name="create-outline" size={16} color="#FFFFFF" /><Text style={styles.editProfileText}>Edit profile and photo</Text></TouchableOpacity>
              <View style={[styles.details, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {[['Phone number', profile.phoneNumber], ['Occupation', profile.occupation], ['Place of work', profile.workplace], ['Marital status', profile.maritalStatus?.replaceAll('_', ' ')], ['Date of birth', profile.dateOfBirth], ['Hobbies', profile.hobbies]].filter(([, value]) => value).map(([label, value]) => <View key={label} style={styles.detailRow}><Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{label}</Text><Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text></View>)}
              </View>
              <View style={[styles.infoRow, { borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.text }]}>Joined Communities:</Text>
                <Text style={[styles.value, { color: theme.secondaryText }]}>{profile.joinedCommunities?.length || 0}</Text>
              </View>

              <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>Preferences</Text>
              <View style={[styles.themeRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <View style={[styles.preferenceIcon, { backgroundColor: theme.primarySoft }]}><Icon name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={theme.primary} /></View>
                <View style={styles.preferenceCopy}><Text style={[styles.label, { color: theme.text }]}>Dark appearance</Text><Text style={[styles.preferenceHint, { color: theme.secondaryText }]}>{isDark ? 'Dark mode is on' : 'Use a darker theme at night'}</Text></View>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: theme.primary }} />
              </View>
              <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>Account</Text>
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
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('BlockedAccounts')}>
                <Icon name="ban" size={18} strokeWidth={1.4} color={theme.danger} />
                <Text style={[styles.menuText, { color: theme.text }]}>Blocked accounts</Text>
                <Text style={[styles.menuValue, { color: theme.secondaryText }]}>{blockedUserIds.length}</Text>
                <Icon name="chevron-forward" size={16} strokeWidth={1.4} color={theme.secondaryText} />
              </TouchableOpacity>

              <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>Help and legal</Text>
              <TouchableOpacity style={[styles.menuRow, { borderColor: theme.border }]} onPress={() => navigation.navigate('HelpCenter')}><Icon name="help-circle-outline" size={18} color={theme.primary} /><Text style={[styles.menuText, { color: theme.text }]}>FAQ, support and policies</Text><Icon name="chevron-forward" size={16} color={theme.secondaryText} /></TouchableOpacity>

              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          );
        }

        const styles = StyleSheet.create({
          container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 45 },
          avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
          name: { fontSize: 24, fontWeight: '700' },
          email: { fontSize: 16, marginBottom: 8 },
          bio: { fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginBottom: 16 },
          verifyButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginBottom: 10 },
          verifyText: { fontSize: 11, fontWeight: '800' }, verified: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }, verifiedText: { fontSize: 11, fontWeight: '700' },
          editProfile: { minHeight: 46, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }, editProfileText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
          details: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
          detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingVertical: 6 },
          detailLabel: { fontSize: 12 },
          detailValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
          infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderTopWidth: 1, marginBottom: 8 },
          label: { fontSize: 16 },
          value: { fontSize: 16 },
          sectionLabel: { alignSelf: 'flex-start', marginTop: 14, marginBottom: 8, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
          themeRow: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 13, borderWidth: 1, borderRadius: 15, marginBottom: 4 },
          preferenceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 }, preferenceCopy: { flex: 1 }, preferenceHint: { fontSize: 11, marginTop: 2 },
          menuRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, paddingVertical: 14, borderTopWidth: 1 },
          menuText: { flex: 1, fontSize: 15, fontWeight: '600' },
          menuValue: { fontSize: 13, fontWeight: '700' },
          logoutButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, marginTop: 24 },
          logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
        });
      
