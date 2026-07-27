import React from 'react';
        import { View, ActivityIndicator, StyleSheet } from 'react-native';
        import { useTheme } from '../context/ThemeContext';

        export default function Loader() {
          const { theme } = useTheme();
          return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
              <ActivityIndicator size="large" color={theme.tint} />
            </View>
          );
        }
        const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
      