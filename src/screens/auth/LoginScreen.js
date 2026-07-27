import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '../../components/AppIcon';
        import { useAuth } from '../../context/AuthContext';
        import { useTheme } from '../../context/ThemeContext';

        export default function LoginScreen({ navigation }) {
          const [email, setEmail] = useState('test@example.com');
          const [password, setPassword] = useState('password');
          const { login } = useAuth();
          const { theme } = useTheme();

          const handleLogin = async () => {
            try {
              await login(email, password);
            } catch (error) {
              Alert.alert('Login Failed', error.message);
            }
          };

          const styles = getStyles(theme);
          return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.logo}><Text style={styles.logoText}>L</Text></View>
              <Text style={styles.kicker}>WELCOME BACK</Text>
              <Text style={styles.title}>Continue your journey.</Text>
              <Text style={styles.subtitle}>Sign in to reconnect with your faith community.</Text>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign in</Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>New to LST? <Text style={styles.linkStrong}>Create an account</Text></Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          );
        }

        const getStyles = (theme) => StyleSheet.create({
          container: { flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' },
          logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
          logoText: { color: '#fff', fontWeight: '800', fontSize: 22 },
          kicker: { fontSize: 11, color: theme.primary, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
          title: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: theme.text, letterSpacing: -1, marginBottom: 10 },
          subtitle: { fontSize: 16, lineHeight: 24, color: theme.secondaryText, marginBottom: 30 },
          label: { color: theme.text, fontWeight: '600', marginBottom: 8, fontSize: 13 },
          input: { backgroundColor: theme.card, color: theme.text, padding: 15, borderRadius: 14, marginBottom: 18, borderWidth: 1, borderColor: theme.border },
          button: { backgroundColor: theme.primary, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 3 },
          buttonText: { color: '#fff', fontWeight: '600' },
          link: { color: theme.secondaryText, textAlign: 'center', marginTop: 24 },
          linkStrong: { color: theme.tint, fontWeight: '700' },
        });
      
