import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
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
            <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.kicker}>JOIN THE COMMUNITY</Text>
              <Text style={styles.title}>A space to belong.</Text>
              <Text style={styles.subtitle}>Create your profile and start growing with people who share your values.</Text>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={theme.secondaryText} value={name} onChangeText={setName} />
              <Text style={styles.label}>Email address</Text>
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.secondaryText} value={email} onChangeText={setEmail} autoCapitalize="none" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor={theme.secondaryText} value={password} onChangeText={setPassword} secureTextEntry />
              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Create account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Already a member? <Text style={styles.linkStrong}>Sign in</Text></Text>
              </TouchableOpacity>
            </ScrollView>
          );
        }

        const getStyles = (theme) => StyleSheet.create({
          container: { flex: 1, backgroundColor: theme.background },
          content: { padding: 24, paddingTop: 90, paddingBottom: 40 },
          kicker: { fontSize: 11, color: theme.primary, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 },
          title: { fontSize: 34, fontWeight: '700', color: theme.text, letterSpacing: -1, marginBottom: 10 },
          subtitle: { fontSize: 16, lineHeight: 24, color: theme.secondaryText, marginBottom: 28 },
          label: { color: theme.text, fontWeight: '600', marginBottom: 8, fontSize: 13 },
          input: { backgroundColor: theme.card, color: theme.text, padding: 15, borderRadius: 14, marginBottom: 18, borderWidth: 1, borderColor: theme.border },
          button: { backgroundColor: theme.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
          buttonText: { color: '#fff', fontWeight: '600' },
          link: { color: theme.secondaryText, textAlign: 'center', marginTop: 24 },
          linkStrong: { color: theme.tint, fontWeight: '700' },
        });
      
