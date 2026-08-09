import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../api/apiService';
import AppIcon from '../../components/AppIcon';
import BrandLogo from '../../components/BrandLogo';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function PasswordFlowScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const changing = Boolean(user);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [working, setWorking] = useState(false);

  const sendCode = async () => {
    if (changing && !currentPassword) return Alert.alert('Current password required', 'Enter your current password first.');
    if (!changing && !email.trim()) return Alert.alert('Email required', 'Enter the email address used for your account.');
    setWorking(true);
    try {
      const response = changing ? await apiService.sendChangePasswordOtp(currentPassword) : await apiService.sendForgotPasswordOtp(email.trim());
      setStep(1);
      Alert.alert('Check your email', `${response.message} The code expires in 10 minutes.`);
    } catch (error) { Alert.alert('Code not sent', error.message); }
    finally { setWorking(false); }
  };

  const savePassword = async () => {
    if (code.length !== 6) return Alert.alert('Code required', 'Enter the six-digit code from your email.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least eight characters.');
    if (password !== confirmation) return Alert.alert('Passwords do not match', 'Enter the same new password twice.');
    setWorking(true);
    try {
      const response = changing
        ? await apiService.changePassword(currentPassword, code, password, confirmation)
        : await apiService.resetForgottenPassword(email.trim(), code, password, confirmation);
      Alert.alert('Password updated', response.message, [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (error) { Alert.alert('Password not changed', error.message); }
    finally { setWorking(false); }
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }];
  return <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <LinearGradient colors={[theme.background, theme.accentSoft, theme.secondaryAccentSoft]} locations={[0.15, 0.62, 1]} style={StyleSheet.absoluteFill} />
    <View style={[styles.orb, styles.orbTop, { backgroundColor: theme.warmAccent }]} />
    <View style={[styles.orb, styles.orbSide, { backgroundColor: theme.secondaryAccent }]} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!changing ? <>
        <BrandLogo width={142} style={styles.logo} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to sign in" style={[styles.back, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={18} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Back to sign in</Text>
        </TouchableOpacity>
      </> : null}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><AppIcon name="lock" size={23} color={theme.primary} /></View>
      <Text style={[styles.title, { color: theme.text }]}>{changing ? 'Change password' : 'Reset your password'}</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{step === 0 ? changing ? 'Confirm your current password. We’ll email you a secure code.' : 'Enter your account email and we’ll send a secure reset code.' : `Enter the code sent to ${email} and choose a new password.`}</Text>

      {step === 0 ? <>
        {!changing ? <><Text style={[styles.label, { color: theme.secondaryText }]}>Email address</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" placeholderTextColor={theme.secondaryText} style={inputStyle} /></> : null}
        {changing ? <><Text style={[styles.label, { color: theme.secondaryText }]}>Current password</Text><PasswordInput theme={theme} value={currentPassword} onChangeText={setCurrentPassword} autoComplete="password" placeholder="Enter current password" /></> : null}
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={sendCode} disabled={working}>{working ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>Send verification code</Text><AppIcon name="paper-plane" size={15} color="#FFFFFF" /></>}</TouchableOpacity>
      </> : <>
        <Text style={[styles.label, { color: theme.secondaryText }]}>Six-digit code</Text><TextInput value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} placeholder="000000" placeholderTextColor={theme.secondaryText} style={[inputStyle, styles.code]} />
        <Text style={[styles.label, { color: theme.secondaryText }]}>New password</Text><PasswordInput theme={theme} value={password} onChangeText={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <Text style={[styles.label, { color: theme.secondaryText }]}>Confirm new password</Text><PasswordInput theme={theme} value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" placeholder="Enter new password again" />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={savePassword} disabled={working}>{working ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Update password</Text>}</TouchableOpacity>
        <TouchableOpacity style={styles.resend} onPress={sendCode} disabled={working}><Text style={[styles.resendText, { color: theme.primary }]}>Send a new code</Text></TouchableOpacity>
      </>}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32, justifyContent: 'center' }, orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 }, orbTop: { width: 180, height: 180, top: -74, right: -54 }, orbSide: { width: 120, height: 120, left: -66, top: '42%' }, back: { alignSelf: 'flex-start', minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 }, backText: { fontSize: 12, fontWeight: '800' }, logo: { alignSelf: 'center', marginBottom: 20 }, card: { borderWidth: 1, borderRadius: 28, padding: 22, shadowColor: '#54233D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 5 }, icon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.7 }, subtitle: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 24 }, label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 7 }, input: { minHeight: 51, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14, marginBottom: 16 }, code: { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: 8 }, button: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 5 }, buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, resend: { alignSelf: 'center', padding: 14, marginTop: 5 }, resendText: { fontSize: 12, fontWeight: '800' } });
