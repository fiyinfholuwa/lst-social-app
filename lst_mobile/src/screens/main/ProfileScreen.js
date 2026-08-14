import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiService from '../../api/apiService';
import Avatar from '../../components/Avatar';
import Icon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import PasswordInput from '../../components/PasswordInput';
import KeyboardSafeView from '../../components/KeyboardSafeView';
import { useAuth } from '../../context/AuthContext';
import { useFriendships } from '../../context/FriendshipsContext';
import { useSavedPosts } from '../../context/SavedPostsContext';
import { useTheme } from '../../context/ThemeContext';

const Detail = ({ label, value, theme }) => value ? (
  <View style={styles.detail}>
    <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
  </View>
) : null;

const MenuRow = ({ icon, label, value, danger = false, onPress, theme }) => (
  <TouchableOpacity style={[styles.menuRow, { borderBottomColor: theme.border }]} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? theme.accentSoft : theme.primarySoft }]}>
      <Icon name={icon} size={17} color={danger ? theme.danger : theme.primary} />
    </View>
    <Text style={[styles.menuText, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
    {value !== undefined ? <Text style={[styles.menuValue, { color: theme.secondaryText }]}>{value}</Text> : null}
    <Icon name="chevron-right" size={14} color={theme.secondaryText} />
  </TouchableOpacity>
);

const AppearanceToggle = ({ value, onChange, theme }) => {
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(position, { toValue: value ? 1 : 0, useNativeDriver: true, friction: 7, tension: 90 }).start();
  }, [position, value]);
  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [2, 32] });

  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel="Dark appearance" onPress={() => onChange(!value)} style={[styles.toggleTrack, { backgroundColor: value ? theme.primary : theme.border }]}>
      <View style={styles.toggleSymbols}><Icon name="sunny-outline" size={13} color={value ? 'rgba(255,255,255,.55)' : theme.secondaryText} /><Icon name="moon-outline" size={13} color={value ? '#FFFFFF' : theme.secondaryText} /></View>
      <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }], backgroundColor: '#FFFFFF' }]}><Icon name={value ? 'moon-outline' : 'sunny-outline'} size={14} color={value ? theme.primary : theme.secondaryText} /></Animated.View>
    </Pressable>
  );
};

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { savedPostIds } = useSavedPosts();
  const { blockedUserIds, friendIds } = useFriendships();
  const [profile, setProfile] = useState(user);
  const [verifying, setVerifying] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [checkingOtp, setCheckingOtp] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadProfile = async () => setProfile(await apiService.getUserProfile());
  useEffect(() => {
    loadProfile();
    return navigation.addListener('focus', loadProfile);
  }, [navigation]);

  const verifyEmail = async () => {
    const isResend = otpVisible;
    setVerifying(true);
    try {
      const response = await apiService.sendEmailVerification();
      setOtp('');
      setOtpNotice(isResend
        ? `A new verification code was sent. Check ${profile.email}, including the spam folder.`
        : `${response.message} Check ${profile.email}, including the spam folder.`);
      setOtpVisible(true);
    } catch (error) {
      Alert.alert('Could not send verification', error.message);
    } finally { setVerifying(false); }
  };

  const submitOtp = async () => {
    if (otp.length !== 6) return Alert.alert('Enter the code', 'Enter the six-digit code sent to your email.');
    setCheckingOtp(true);
    try {
      const response = await apiService.verifyEmailOtp(otp);
      setOtpVisible(false);
      setOtp('');
      const verifiedProfile = await refreshUser();
      setProfile(verifiedProfile);
      Alert.alert('Email verified', response.message);
    } catch (error) {
      Alert.alert('Code not accepted', error.message);
    } finally { setCheckingOtp(false); }
  };

  const requestDelete = () => Alert.alert(
    'Delete your account?',
    'Your profile, posts, comments, messages and account data will be permanently removed. This cannot be undone.',
    [
      { text: 'Keep account', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => setDeleteVisible(true) },
    ],
  );

  const deleteAccount = async () => {
    if (!password) return Alert.alert('Password required', 'Enter your password to confirm account deletion.');
    setDeleting(true);
    try {
      await apiService.deleteAccount(password);
      setDeleteVisible(false);
      setPassword('');
      await logout();
    } catch (error) {
      Alert.alert('Account not deleted', error.message);
    } finally { setDeleting(false); }
  };

  const handleLogout = () => Alert.alert('Log out?', 'You will need to sign in again to access your account.', [
    { text: 'Stay signed in', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: logout },
  ]);

  if (!profile) return null;
  const details = [
    ['Phone', profile.phoneNumber],
    ['Occupation', profile.occupation],
    ['Workplace', profile.workplace],
    ['Status', profile.maritalStatus?.replaceAll('_', ' ')],
    ['Birthday', profile.dateOfBirth],
    ['Hobbies', profile.hobbies],
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScreenHeader eyebrow="YOUR SPACE" title="My profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.identity}>
            <Avatar uri={profile.avatar} size={82} style={styles.avatar} accessibilityLabel={`${profile.name}'s profile avatar`} />
            <View style={styles.identityCopy}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{profile.name}</Text>
              <Text style={[styles.email, { color: theme.secondaryText }]} numberOfLines={1}>{profile.email}</Text>
              {profile.emailVerified ? (
                <View style={styles.verified}><Icon name="check-circle" size={13} color={theme.primary} /><Text style={[styles.statusText, { color: theme.primary }]}>Verified email</Text></View>
              ) : (
                <TouchableOpacity style={[styles.verify, { backgroundColor: theme.accentSoft }]} onPress={verifyEmail} disabled={verifying}><Icon name="mail-outline" size={13} color={theme.accent} /><Text style={[styles.statusText, { color: theme.accent }]}>{verifying ? 'Sending…' : 'Verify email'}</Text></TouchableOpacity>
              )}
            </View>
          </View>
          {profile.bio ? <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text> : <Text style={[styles.emptyBio, { color: theme.secondaryText }]}>Add a bio so people can get to know you.</Text>}
          <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('EditProfile')}><Icon name="create-outline" size={16} color="#FFFFFF" /><Text style={styles.editText}>Edit profile</Text></TouchableOpacity>
        </View>

        <View style={[styles.stats, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[['Circles', profile.joinedCommunities?.length || 0], ['Friends', friendIds.length], ['Saved', savedPostIds.length]].map(([label, value], index) => <View key={label} style={[styles.stat, index > 0 && { borderLeftColor: theme.border, borderLeftWidth: 1 }]}><Text style={[styles.statValue, { color: theme.text }]}>{value}</Text><Text style={[styles.statLabel, { color: theme.secondaryText }]}>{label}</Text></View>)}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>About me</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {details.some(([, value]) => value) ? details.map(([label, value]) => <Detail key={label} label={label} value={value} theme={theme} />) : <TouchableOpacity style={styles.completeProfile} onPress={() => navigation.navigate('EditProfile')}><Icon name="add" size={17} color={theme.primary} /><Text style={[styles.completeText, { color: theme.primary }]}>Complete your personal details</Text></TouchableOpacity>}
          <View style={[styles.privacyStatus, { backgroundColor: theme.primarySoft }]}><Icon name={profile.isProfilePrivate ? 'lock' : 'people-outline'} size={14} color={theme.primary} /><Text style={[styles.privacyText, { color: theme.primary }]}>{profile.isProfilePrivate ? 'Private profile' : 'Public profile'}</Text></View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.appearanceRow}><View style={[styles.menuIcon, { backgroundColor: theme.primarySoft }]}><Icon name={isDark ? 'moon-outline' : 'sunny-outline'} size={17} color={theme.primary} /></View><View style={styles.appearanceCopy}><Text style={[styles.appearanceTitle, { color: theme.text }]}>Dark appearance</Text><Text style={[styles.appearanceDescription, { color: theme.secondaryText }]}>{isDark ? 'Dark mode is currently active' : 'Switch to a darker colour theme'}</Text></View><AppearanceToggle value={isDark} onChange={toggleTheme} theme={theme} /></View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MenuRow icon="users" label="Friends" value={friendIds.length} onPress={() => navigation.navigate('Friends')} theme={theme} />
          <MenuRow icon="bookmark" label="Saved posts" value={savedPostIds.length} onPress={() => navigation.navigate('SavedPosts')} theme={theme} />
          <MenuRow icon="ban" label="Blocked accounts" value={blockedUserIds.length} onPress={() => navigation.navigate('BlockedAccounts')} theme={theme} />
          <MenuRow icon="lock" label="Change password" onPress={() => navigation.navigate('ChangePassword')} theme={theme} />
          <MenuRow icon="trash" label="Delete account" danger onPress={requestDelete} theme={theme} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Help and legal</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MenuRow icon="help-circle-outline" label="FAQ and support" onPress={() => navigation.navigate('HelpCenter')} theme={theme} />
        </View>

        <TouchableOpacity style={[styles.logout, { borderColor: theme.danger }]} onPress={handleLogout}><Icon name="sign-out-alt" size={16} color={theme.danger} /><Text style={[styles.logoutText, { color: theme.danger }]}>Log out</Text></TouchableOpacity>
      </ScrollView>

      <Modal visible={otpVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !checkingOtp && setOtpVisible(false)}>
        <KeyboardSafeView>
        <Pressable style={styles.modalBackdrop} onPress={() => !checkingOtp && setOtpVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close email verification"
              style={[styles.modalClose, { backgroundColor: theme.background }]}
              onPress={() => setOtpVisible(false)}
              disabled={checkingOtp}
            >
              <Icon name="times" size={18} color={theme.secondaryText} />
            </TouchableOpacity>
            <View style={[styles.modalIcon, { backgroundColor: theme.primarySoft }]}><Icon name="mail-outline" size={25} color={theme.primary} /></View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Verify your email</Text>
            <Text style={[styles.modalMessage, { color: theme.secondaryText }]}>Enter the six-digit code sent to {profile.email}. It expires in 10 minutes.</Text>
            {otpNotice ? <View style={[styles.otpNotice, { backgroundColor: theme.primarySoft }]}><Icon name="check-circle" size={16} color={theme.primary} /><Text style={[styles.otpNoticeText, { color: theme.primary }]}>{otpNotice}</Text></View> : null}
            <TextInput
              value={otp}
              onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              textContentType="oneTimeCode"
              style={[styles.otpInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="000000"
              placeholderTextColor={theme.secondaryText}
            />
            <TouchableOpacity style={[styles.modalPrimary, { backgroundColor: theme.primary }]} onPress={submitOtp} disabled={checkingOtp}>{checkingOtp ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Verify email</Text>}</TouchableOpacity>
            <TouchableOpacity style={styles.modalLink} onPress={verifyEmail} disabled={verifying || checkingOtp}><Text style={[styles.modalLinkText, { color: theme.primary }]}>{verifying ? 'Sending…' : 'Send a new code'}</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
        </KeyboardSafeView>
      </Modal>

      <Modal visible={deleteVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !deleting && setDeleteVisible(false)}>
        <KeyboardSafeView>
        <Pressable style={styles.modalBackdrop} onPress={() => !deleting && setDeleteVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: theme.accentSoft }]}><Icon name="trash" size={24} color={theme.danger} /></View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm account deletion</Text>
            <Text style={[styles.modalMessage, { color: theme.secondaryText }]}>Enter your password. This permanently deletes your account and cannot be reversed.</Text>
            <PasswordInput theme={theme} value={password} onChangeText={setPassword} autoFocus placeholder="Your password" containerStyle={[styles.passwordInput, { backgroundColor: theme.background }]} />
            <View style={styles.modalActions}><TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setDeleteVisible(false)} disabled={deleting}><Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.modalDelete, { backgroundColor: theme.danger }]} onPress={deleteAccount} disabled={deleting}>{deleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Delete forever</Text>}</TouchableOpacity></View>
          </Pressable>
        </Pressable>
        </KeyboardSafeView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 14, paddingBottom: 100 }, hero: { borderWidth: 1, borderRadius: 22, padding: 17 }, identity: { flexDirection: 'row', alignItems: 'center' }, avatar: { marginRight: 14 }, identityCopy: { flex: 1 }, name: { fontSize: 21, fontWeight: '800' }, email: { fontSize: 12, marginTop: 3 }, verified: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }, verify: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, marginTop: 7 }, statusText: { fontSize: 10, fontWeight: '800' }, bio: { fontSize: 13, lineHeight: 20, marginTop: 15 }, emptyBio: { fontSize: 12, lineHeight: 18, marginTop: 15, fontStyle: 'italic' }, editButton: { height: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 15 }, editText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, stats: { flexDirection: 'row', borderWidth: 1, borderRadius: 17, marginTop: 11, paddingVertical: 14 }, stat: { flex: 1, alignItems: 'center' }, statValue: { fontSize: 18, fontWeight: '800' }, statLabel: { fontSize: 10, marginTop: 3, fontWeight: '600' }, sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 22, marginBottom: 8, marginLeft: 3 }, card: { borderWidth: 1, borderRadius: 17, overflow: 'hidden' }, detail: { flexDirection: 'row', gap: 14, paddingHorizontal: 15, paddingTop: 13 }, detailLabel: { width: 82, fontSize: 11 }, detailValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }, privacyStatus: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, margin: 14, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 }, privacyText: { fontSize: 10, fontWeight: '800' }, completeProfile: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 15 }, completeText: { fontSize: 12, fontWeight: '800' }, appearanceRow: { minHeight: 78, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, appearanceCopy: { flex: 1, minWidth: 0 }, appearanceTitle: { fontSize: 13, fontWeight: '800' }, appearanceDescription: { fontSize: 10, lineHeight: 15, marginTop: 3 }, toggleTrack: { width: 64, height: 36, borderRadius: 18, justifyContent: 'center', position: 'relative' }, toggleSymbols: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, toggleThumb: { position: 'absolute', left: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 4 }, menuRow: { minHeight: 58, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth }, menuIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, menuText: { flex: 1, fontSize: 13, fontWeight: '700' }, menuValue: { fontSize: 11, fontWeight: '700' }, logout: { height: 50, borderWidth: 1, borderRadius: 15, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, logoutText: { fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(28,17,24,0.62)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modalCard: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 24, padding: 22, alignItems: 'center' }, modalClose: { position: 'absolute', top: 13, right: 13, zIndex: 2, width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, modalIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' }, modalMessage: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 }, otpNotice: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 13, padding: 11, marginTop: 14 }, otpNoticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '700' }, otpInput: { width: '100%', height: 58, borderWidth: 1, borderRadius: 15, marginTop: 14, textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 9 }, passwordInput: { width: '100%', marginTop: 20, marginBottom: 0 }, modalPrimary: { width: '100%', height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, modalPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, modalLink: { padding: 12, marginTop: 3 }, modalLinkText: { fontSize: 12, fontWeight: '800' }, modalActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 13 }, modalCancel: { flex: 1, height: 50, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, modalCancelText: { fontSize: 13, fontWeight: '800' }, modalDelete: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
