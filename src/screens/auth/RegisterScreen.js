import React, { useState } from 'react';
        import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
        import { useAuth } from '../../context/AuthContext';
        import { useTheme } from '../../context/ThemeContext';

        export default function RegisterScreen({ navigation }) {
          const [name, setName] = useState('');
          const [email, setEmail] = useState('');
          const [password, setPassword] = useState('');
          const { register } = useAuth();
          const { theme } = useTheme();

          const handleRegister = async () => {
            if (!name || !email || !password) {
              Alert.alert('Error', 'All fields are required');
              return;
            }
            try {
              await register(name, email, password);
            } catch (error) {
              Alert.alert('Registration Failed', error.message);
            }
          };

          const styles = getStyles(theme);
          return (
            <View style={styles.container}>
              <Text style={styles.title}>Create Account</Text>
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={theme.secondaryText} value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.secondaryText} value={email} onChangeText={setEmail} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor={theme.secondaryText} value={password} onChangeText={setPassword} secureTextEntry />
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const getStyles = (theme) => StyleSheet.create({
          container: { flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' },
          title: { fontSize: 28, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 20 },
          input: { backgroundColor: theme.card, color: theme.text, padding: 14, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
          button: { backgroundColor: theme.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
          buttonText: { color: '#fff', fontWeight: '600' },
          link: { color: theme.tint, textAlign: 'center', marginTop: 20 },
        });
      