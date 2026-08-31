import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import AuthField from '../../components/AuthField';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../api/apiService';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const validateForm = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      Alert.alert('Enter your email', 'An email address is required to continue.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Alert.alert('Check your email', 'Please enter a valid email address.');
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Tell us your name', 'Please enter both your first and last name.');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Password is too short', 'Your password must contain at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Please enter the same password in both fields.');
      return false;
    }
    return true;
  };

  const submitRegistration = async () => {
    if (!validateForm()) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await apiService.checkEmailAvailability(normalizedEmail);
      if (!result.available) {
        Alert.alert('Email already registered', 'An account already uses this email. Sign in instead or enter a different email.');
        return;
      }
      await register(firstName.trim(), lastName.trim(), normalizedEmail, password, confirmPassword);
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
          <TouchableOpacity style={[styles.back, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => navigation.goBack()} accessibilityLabel="Back to sign in">
            <Icon name="arrow-back" size={19} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <BrandLogo width={118} />
          </View>
          <View style={styles.topSpacer} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.stepIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="person-add-outline" size={21} color={theme.accent} />
          </View>
          <Text style={[styles.kicker, { color: theme.accent }]}>CREATE YOUR ACCOUNT</Text>
          <Text style={[styles.title, { color: theme.text }]}>Join the community.</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Enter your details below to create your LST Social account.</Text>

          <AuthField label="Email address" icon="mail-outline" theme={theme} style={styles.fieldSpacing} placeholder="you@example.com" value={email} onChangeText={setEmail} autoFocus autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" />
          <AuthField label="First name" icon="person-outline" theme={theme} style={styles.fieldSpacing} placeholder="Your first name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" textContentType="givenName" returnKeyType="next" />
          <AuthField label="Last name" icon="person-outline" theme={theme} style={styles.fieldSpacing} placeholder="Your last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" textContentType="familyName" returnKeyType="next" />
          <AuthField label="Password" icon="lock" theme={theme} style={styles.fieldSpacing} placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" returnKeyType="next" />
          <AuthField label="Confirm password" icon="shield-checkmark-outline" theme={theme} style={styles.fieldSpacing} placeholder="Enter your password again" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={submitRegistration} />
          <View style={styles.passwordHint}>
            <Icon name={password.length >= 8 ? 'check-circle' : 'information-circle-outline'} size={16} color={password.length >= 8 ? theme.accent : theme.secondaryText} />
            <Text style={[styles.passwordHintText, { color: password.length >= 8 ? theme.accent : theme.secondaryText }]}>At least 8 characters</Text>
          </View>

          <TouchableOpacity activeOpacity={0.86} onPress={submitRegistration} disabled={submitting}>
            <LinearGradient colors={[theme.primary, theme.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <>
                <Text style={styles.buttonText}>Create my account</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.terms, { color: theme.secondaryText }]}>By continuing, you agree to our Terms and Community Guidelines.</Text>
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
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 30 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.1 },
  orbTop: { width: 180, height: 180, top: -80, right: -55 },
  orbBottom: { width: 150, height: 150, bottom: 20, left: -86 },
  topRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandRow: { position: 'absolute', left: 60, right: 60, alignItems: 'center', justifyContent: 'center' },
  topSpacer: { width: 42 },
  card: { borderWidth: 1, borderRadius: 28, padding: 22, shadowColor: '#54233D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 6, elevation: 1 },
  stepIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 9 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -1, marginBottom: 9 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  fieldSpacing: { marginBottom: 14 },
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -4, marginBottom: 20 },
  passwordHintText: { fontSize: 12, fontWeight: '600' },
  button: { minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  terms: { fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 14 },
  switchLink: { paddingVertical: 22 },
  switchText: { textAlign: 'center', fontSize: 14 },
});
