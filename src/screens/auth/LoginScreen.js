import React, { useState } from 'react';
        import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
            <View style={styles.container}>
              <Text style={styles.title}>LST Social</Text>
              <Text style={styles.subtitle}>Faith. Family. Fellowship.</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Don't have an account? Register</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const getStyles = (theme) => StyleSheet.create({
          container: { flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' },
          title: { fontSize: 32, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 4 },
          subtitle: { fontSize: 16, color: theme.secondaryText, textAlign: 'center', marginBottom: 30 },
          input: { backgroundColor: theme.card, color: theme.text, padding: 14, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
          button: { backgroundColor: theme.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
          buttonText: { color: '#fff', fontWeight: '600' },
          link: { color: theme.tint, textAlign: 'center', marginTop: 20 },
        });
      