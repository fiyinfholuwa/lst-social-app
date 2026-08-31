import React, { useMemo } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { SavedPostsProvider } from './src/context/SavedPostsContext';
import { FriendshipsProvider } from './src/context/FriendshipsContext';
import { CommunityApplicationsProvider } from './src/context/CommunityApplicationsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { AppAlertProvider } from './src/context/AppAlertContext';
import { ChatUnreadProvider } from './src/context/ChatUnreadContext';
import { ConnectivityProvider } from './src/context/ConnectivityContext';
import PushNotificationManager from './src/components/PushNotificationManager';
import DeepLinkManager from './src/components/DeepLinkManager';
import AppUpdateManager from './src/components/AppUpdateManager';
import { flushPendingPush, navigationRef } from './src/navigation/navigationRef';

function AppContent() {
  const { isDark, theme } = useTheme();
  const navigationTheme = useMemo(() => ({
    ...(isDark ? NavigationDarkTheme : NavigationLightTheme),
    colors: {
      ...(isDark ? NavigationDarkTheme.colors : NavigationLightTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
  }), [isDark, theme]);
  return (
      <OnboardingProvider>
        <AuthProvider>
          <SavedPostsProvider>
            <FriendshipsProvider>
              <CommunityApplicationsProvider>
                <NotificationsProvider>
                  <ChatUnreadProvider>
                  <ConnectivityProvider>
                  <AppAlertProvider>
                    <AppUpdateManager />
                    <PushNotificationManager />
                    <DeepLinkManager />
                    <NavigationContainer ref={navigationRef} onReady={flushPendingPush} theme={navigationTheme}>
                      <AppNavigator />
                      <StatusBar style={isDark ? 'light' : 'dark'} />
                    </NavigationContainer>
                  </AppAlertProvider>
                  </ConnectivityProvider>
                  </ChatUnreadProvider>
                </NotificationsProvider>
              </CommunityApplicationsProvider>
            </FriendshipsProvider>
          </SavedPostsProvider>
        </AuthProvider>
      </OnboardingProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
