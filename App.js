import React from 'react';
        import { NavigationContainer } from '@react-navigation/native';
        import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { SavedPostsProvider } from './src/context/SavedPostsContext';
import { FriendshipsProvider } from './src/context/FriendshipsContext';
import { CommunityApplicationsProvider } from './src/context/CommunityApplicationsContext';

        export default function App() {
          return (
    <ThemeProvider>
      <OnboardingProvider>
        <SavedPostsProvider>
          <FriendshipsProvider>
            <CommunityApplicationsProvider>
              <AuthProvider>
                <NavigationContainer>
                  <AppNavigator />
          <StatusBar style="auto" />
                </NavigationContainer>
              </AuthProvider>
            </CommunityApplicationsProvider>
          </FriendshipsProvider>
        </SavedPostsProvider>
      </OnboardingProvider>
            </ThemeProvider>
          );
        }
      
