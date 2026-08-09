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
import { NotificationsProvider } from './src/context/NotificationsContext';
import { AppAlertProvider } from './src/context/AppAlertContext';

        export default function App() {
          return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthProvider>
          <SavedPostsProvider>
            <FriendshipsProvider>
              <CommunityApplicationsProvider>
                <NotificationsProvider>
                  <AppAlertProvider>
                    <NavigationContainer>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </NavigationContainer>
                  </AppAlertProvider>
                </NotificationsProvider>
              </CommunityApplicationsProvider>
            </FriendshipsProvider>
          </SavedPostsProvider>
        </AuthProvider>
      </OnboardingProvider>
            </ThemeProvider>
          );
        }
      
