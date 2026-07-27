import React from 'react';
        import { NavigationContainer } from '@react-navigation/native';
        import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

        export default function App() {
          return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthProvider>
                <NavigationContainer>
                  <AppNavigator />
          <StatusBar style="auto" />
                </NavigationContainer>
        </AuthProvider>
      </OnboardingProvider>
            </ThemeProvider>
          );
        }
      
