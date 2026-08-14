import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import AuthField from '../../components/AuthField';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';

const steps = [
  { eyebrow: 'YOUR EMAIL', title: 'Let’s start with email.', subtitle: 'We’ll use this to keep your account secure and help you sign in.' },
  { eyebrow: 'ABOUT YOU', title: 'What should we call you?', subtitle: 'Use your real name so connections in the community feel genuine.' },
  { eyebrow: 'SECURE ACCOUNT', title: 'Create your password.', subtitle: 'Choose a password you don’t use elsewhere and confirm it below.' },
];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const current = steps[step];

  const goBack = () => {
    if (step > 0) setStep(value => value - 1);
    else navigation.goBack();
  };

  const validateStep = () => {
    if (step === 0) {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        Alert.alert('Enter your email', 'An email address is required to continue.');
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        Alert.alert('Check your email', 'Please enter a valid email address.');
        return false;
      }
    }

    if (step === 1 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Tell us your name', 'Please enter both your first and last name.');
      return false;
    }

    if (step === 2) {
      if (password.length < 8) {
        Alert.alert('Password is too short', 'Your password must contain at least 8 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Passwords don’t match', 'Please enter the same password in both fields.');
        return false;
      }
    }

    return true;
  };

  const continueRegistration = async () => {
    if (!validateStep()) return;
    if (step === 0) {
      if (submitting) return;
      setSubmitting(true);
      try {
        const result = await apiService.checkEmailAvailability(email.trim());
        if (!result.available) {
          Alert.alert('Email already registered', 'An account already uses this email. Sign in instead or enter a different email.');
          return;
        }
        setEmail(email.trim().toLowerCase());
        setStep(1);
      } catch (error) {
        Alert.alert('Couldn’t check email', error.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (step < steps.length - 1) {
      setStep(value => value + 1);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password, confirmPassword);
    } catch (error) {
      Alert.alert('Couldn’t create account', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[theme.background, theme.secondaryAccentSoft, theme.accentSoft]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, styles.orbTop, { backgroundColor: theme.secondaryAccent }]} />
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: theme.warmAccent }]} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.back, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={goBack} accessibilityLabel={step ? 'Previous step' : 'Back to sign in'}>
            <Icon name="arrow-back" size={19} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <BrandLogo width={102} />
          </View>
          <Text style={[styles.stepCount, { color: theme.secondaryText }]}>{step + 1} of {steps.length}</Text>
        </View>

        <View style={styles.progressRow}>
          {steps.map((_, index) => (
            <View key={index} style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { backgroundColor: index <= step ? theme.accent : 'transparent' }]} />
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.stepIcon, { backgroundColor: step === 1 ? theme.secondaryAccentSoft : theme.accentSoft }]}>
            <Icon name={step === 0 ? 'mail-outline' : step === 1 ? 'people-outline' : 'shield-checkmark-outline'} size={21} color={step === 1 ? theme.secondaryAccent : theme.accent} />
          </View>
          <Text style={[styles.kicker, { color: theme.accent }]}>{current.eyebrow}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{current.subtitle}</Text>

          {step === 0 ? (
            <AuthField label="Email address" icon="mail-outline" theme={theme} style={styles.fieldSpacing} placeholder="you@example.com" value={email} onChangeText={setEmail} autoFocus autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" onSubmitEditing={continueRegistration} />
          ) : null}

          {step === 1 ? (
            <>
              <AuthField label="First name" icon="person-outline" theme={theme} style={styles.fieldSpacing} placeholder="Your first name" value={firstName} onChangeText={setFirstName} autoFocus autoComplete="given-name" textContentType="givenName" returnKeyType="next" />
              <AuthField label="Last name" icon="person-outline" theme={theme} style={styles.fieldSpacing} placeholder="Your last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" returnKeyType="next" onSubmitEditing={continueRegistration} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <AuthField label="Password" icon="lock" theme={theme} style={styles.fieldSpacing} placeholder="At least 8 characters" value={password} onChangeText={setPassword} autoFocus secureTextEntry autoComplete="new-password" returnKeyType="next" />
              <AuthField label="Confirm password" icon="shield-checkmark-outline" theme={theme} style={styles.fieldSpacing} placeholder="Enter your password again" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={continueRegistration} />
              <View style={styles.passwordHint}>
                <Icon name={password.length >= 8 ? 'check-circle' : 'information-circle-outline'} size={16} color={password.length >= 8 ? theme.accent : theme.secondaryText} />
                <Text style={[styles.passwordHintText, { color: password.length >= 8 ? theme.accent : theme.secondaryText }]}>At least 8 characters</Text>
              </View>
            </>
          ) : null}

          <TouchableOpacity activeOpacity={0.86} onPress={continueRegistration} disabled={submitting}>
            <LinearGradient colors={[theme.primary, theme.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <>
                <Text style={styles.buttonText}>{step === steps.length - 1 ? 'Create my account' : 'Continue'}</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </>}
            </LinearGradient>
          </TouchableOpacity>

          {step === 2 ? <Text style={[styles.terms, { color: theme.secondaryText }]}>By continuing, you agree to our Terms and Community Guidelines.</Text> : null}
        </View>

        <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.switchText, { color: theme.secondaryText }]}>Already a member? <Text style={{ color: theme.primary, fontWeight: '800' }}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = theme => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 30 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 180, height: 180, top: -80, right: -55 },
  orbBottom: { width: 150, height: 150, bottom: 20, left: -86 },
  topRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandRow: { position: 'absolute', left: 60, right: 60, alignItems: 'center', justifyContent: 'center' },
  stepCount: { fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  progressTrack: { flex: 1, height: 4, borderRadius: 4, overflow: 'hidden' },
  progressFill: { flex: 1, borderRadius: 4 },
  card: { borderWidth: 1, borderRadius: 28, padding: 22, minHeight: 470, shadowColor: '#54233D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 5 },
  stepIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 9 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -1, marginBottom: 9 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 26 },
  fieldSpacing: { marginBottom: 17 },
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -4, marginBottom: 20 },
  passwordHintText: { fontSize: 12, fontWeight: '600' },
  button: { minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 'auto' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  terms: { fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 14 },
  switchLink: { paddingVertical: 22 },
  switchText: { textAlign: 'center', fontSize: 14 },
});
