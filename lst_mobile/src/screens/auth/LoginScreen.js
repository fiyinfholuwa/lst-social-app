import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../components/AppIcon';
import AuthField from '../../components/AuthField';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Couldn’t sign in', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={[theme.background, theme.accentSoft, theme.secondaryAccentSoft]}
        locations={[0.15, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: theme.warmAccent }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbSide, { backgroundColor: theme.secondaryAccent }]} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <BrandLogo width={174} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.welcomeIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="sparkles-outline" size={20} color={theme.accent} />
          </View>
          <Text style={[styles.kicker, { color: theme.accent }]}>WELCOME BACK</Text>
          <Text style={[styles.title, { color: theme.text }]}>Your community is waiting.</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Sign in to continue the conversations and connections that matter.</Text>

          <AuthField
            label="Email address"
            icon="mail-outline"
            theme={theme}
            style={styles.fieldSpacing}
            placeholder="you@example.com"
            defaultValue=""
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <AuthField
            label="Password"
            icon="lock"
            theme={theme}
            style={styles.fieldSpacing}
            placeholder="Enter your password"
            defaultValue=""
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.86} onPress={handleLogin} disabled={submitting}>
            <LinearGradient colors={[theme.primary, theme.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <>
                <Text style={styles.buttonText}>Sign in</Text>
                <View style={styles.buttonIcon}><Icon name="arrow-forward" size={17} color="#FFFFFF" /></View>
              </>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.trustRow, { borderTopColor: theme.border }]}>
            <Icon name="shield-checkmark-outline" size={15} color={theme.secondaryText} />
            <Text style={[styles.trustText, { color: theme.secondaryText }]}>A private, respectful space for genuine connection</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.switchText, { color: theme.secondaryText }]}>New to LST? <Text style={{ color: theme.primary, fontWeight: '800' }}>Create an account</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = theme => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 64, paddingBottom: 34 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  orbTop: { width: 180, height: 180, top: -74, right: -54 },
  orbSide: { width: 120, height: 120, left: -66, top: '37%', opacity: 0.09 },
  brandRow: { alignItems: 'center', marginBottom: 22 },
  card: { borderWidth: 1, borderRadius: 28, padding: 22, shadowColor: '#54233D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 5 },
  welcomeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 9 },
  title: { fontSize: 31, lineHeight: 37, fontWeight: '800', letterSpacing: -1, marginBottom: 9 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 25 },
  fieldSpacing: { marginBottom: 17 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 20, paddingVertical: 3 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  button: { minHeight: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  buttonIcon: { width: 27, height: 27, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  trustRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  trustText: { fontSize: 11, flexShrink: 1, textAlign: 'center' },
  switchLink: { paddingVertical: 22 },
  switchText: { textAlign: 'center', fontSize: 14 },
});
