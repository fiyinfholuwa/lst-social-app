import React from 'react';
import { Text, TextInput } from 'react-native';
        import { NavigationContainer } from '@react-navigation/native';
        import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { SavedPostsProvider } from './src/context/SavedPostsContext';
import { FriendshipsProvider } from './src/context/FriendshipsContext';
import { CommunityApplicationsProvider } from './src/context/CommunityApplicationsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { FONT_FAMILY } from './src/styles/typography';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: FONT_FAMILY }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: FONT_FAMILY }, TextInput.defaultProps.style];

        export default function App() {
          return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthProvider>
          <SavedPostsProvider>
            <FriendshipsProvider>
              <CommunityApplicationsProvider>
                <NotificationsProvider>
                  <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </NotificationsProvider>
              </CommunityApplicationsProvider>
            </FriendshipsProvider>
          </SavedPostsProvider>
        </AuthProvider>
      </OnboardingProvider>
            </ThemeProvider>
          );
        }
      
