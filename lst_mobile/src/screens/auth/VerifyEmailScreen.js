import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { navigationRef } from '../../navigation/navigationRef';

export default function VerifyEmailScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const requestedOnMount = useRef(false);
  const toastTimer = useRef(null);
  const styles = getStyles(theme);

  const showSentToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000);
  };

  const sendCode = async ({ automatic = false } = {}) => {
    if (sending) return;
    setSending(true);
    try {
      const response = await apiService.sendEmailVerification();
      setNotice(`${response.message} Check your inbox and spam folder.`);
      showSentToast();
    } catch (error) {
      if (!automatic) Alert.alert('Could not send code', error.message);
      else setNotice('We could not send the code automatically. Tap “Send a new code” to try again.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (requestedOnMount.current) return;
    requestedOnMount.current = true;
    sendCode({ automatic: true });
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const submitCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Enter all six digits', 'Use the six-digit verification code sent to your email.');
      return;
    }
    setVerifying(true);
    try {
      await apiService.verifyEmailOtp(code);
      setCode('');
      try {
        await refreshUser();
      } catch {
        // Verification succeeded on the server. Retry profile refresh when the
        // confirmation is dismissed rather than reporting the code as invalid.
      }
      Alert.alert(
        'Email verified successfully',
        'Your email address is confirmed. You can now post, share and join communities.',
        [{
          text: 'Go to my profile',
          onPress: async () => {
            try { await refreshUser(); } catch {}
            if (navigationRef.isReady()) {
              navigationRef.navigate('MainTabs', { screen: 'Profile' });
            }
          },
        }],
        { cancelable: false },
      );
    } catch (error) {
      Alert.alert('Code not accepted', error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[theme.background, theme.accentSoft, theme.secondaryAccentSoft]} style={StyleSheet.absoluteFill} />
      {toastVisible ? (
        <View pointerEvents="none" accessibilityRole="alert" style={[styles.toast, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <View style={[styles.toastIcon, { backgroundColor: theme.primarySoft }]}><AppIcon name="check-circle" size={22} color={theme.primary} /></View>
          <View style={styles.toastCopy}>
            <Text style={[styles.toastTitle, { color: theme.text }]}>Verification email sent</Text>
            <Text style={[styles.toastText, { color: theme.secondaryText }]}>Check your inbox and spam folder for the six-digit code.</Text>
          </View>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandLogo width={150} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><AppIcon name="mail-outline" size={30} color={theme.primary} /></View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>ONE LAST STEP</Text>
          <Text style={[styles.title, { color: theme.text }]}>Verify your email</Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>We sent a six-digit code to</Text>
          <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>
          <View style={[styles.requiredNotice, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <AppIcon name="shield-checkmark-outline" size={18} color={theme.accent} />
            <Text style={[styles.requiredText, { color: theme.text }]}>Verification unlocks posting, sharing and community participation.</Text>
          </View>
          {notice ? <Text style={[styles.notice, { color: theme.secondaryText }]}>{notice}</Text> : null}
          <TextInput
            value={code}
            onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            placeholder="000000"
            placeholderTextColor={theme.secondaryText}
            style={[styles.codeInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            onSubmitEditing={submitCode}
          />
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={submitCode} disabled={verifying || sending}>
            {verifying ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryText}>Verify and continue</Text><AppIcon name="arrow-forward" size={17} color="#FFFFFF" /></>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => sendCode()} disabled={sending || verifying}>
            <Text style={[styles.linkText, { color: theme.primary }]}>{sending ? 'Sending code…' : 'Send a new code'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.continueButton, { borderColor: theme.border }]} onPress={() => navigation.replace('MainTabs')} disabled={verifying}>
            <Text style={[styles.continueText, { color: theme.text }]}>Continue for now</Text>
          </TouchableOpacity>
          <Text style={[styles.restrictionText, { color: theme.secondaryText }]}>You can browse the app, but posting and joining communities still require verification.</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} disabled={verifying}>
          <Text style={[styles.logoutText, { color: theme.secondaryText }]}>Wrong account? Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = theme => StyleSheet.create({
  screen: { flex: 1 },
  toast: { position: 'absolute', zIndex: 20, elevation: 20, top: Platform.OS === 'ios' ? 58 : 34, left: 18, right: 18, minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 18 },
  toastIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toastCopy: { flex: 1 },
  toastTitle: { fontSize: 14, fontWeight: '900' },
  toastText: { fontSize: 11.5, lineHeight: 16, marginTop: 2, fontWeight: '600' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 30 },
  card: { width: '100%', maxWidth: 430, marginTop: 24, borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center', shadowColor: '#54233D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 5 },
  icon: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  email: { fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: 4, textAlign: 'center' },
  requiredNotice: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, padding: 12, marginTop: 20 },
  requiredText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  notice: { fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 14, paddingHorizontal: 8, fontWeight: '600' },
  codeInput: { width: '100%', height: 62, borderWidth: 1, borderRadius: 17, marginTop: 18, textAlign: 'center', fontSize: 25, fontWeight: '900', letterSpacing: 9 },
  primaryButton: { width: '100%', height: 54, borderRadius: 16, marginTop: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  linkButton: { paddingHorizontal: 18, paddingVertical: 14, marginTop: 2 },
  linkText: { fontSize: 12, fontWeight: '800' },
  continueButton: { width: '100%', height: 50, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  continueText: { fontSize: 13, fontWeight: '800' },
  restrictionText: { fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  logoutButton: { padding: 16 },
  logoutText: { fontSize: 12, fontWeight: '700' },
});
