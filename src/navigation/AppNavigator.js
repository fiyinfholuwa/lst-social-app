import React from 'react';
        import { createNativeStackNavigator } from '@react-navigation/native-stack';
        import { useAuth } from '../context/AuthContext';
        import AuthNavigator from './AuthNavigator';
        import MainTabNavigator from './MainTabNavigator';
        import PostScreen from '../screens/main/PostScreen';
        import CommunityDetailScreen from '../screens/main/CommunityDetailScreen';
        import ChatDetailScreen from '../screens/main/ChatDetailScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { useOnboarding } from '../context/OnboardingContext';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';
import SavedPostsScreen from '../screens/main/SavedPostsScreen';

        const Stack = createNativeStackNavigator();

        export default function AppNavigator() {
          const { user, loading } = useAuth();
          const { hasCompletedOnboarding } = useOnboarding();
          const { theme } = useTheme();

          if (loading || hasCompletedOnboarding === null) return <Loader />;
          if (!hasCompletedOnboarding) return <OnboardingScreen />;

          return (
            <Stack.Navigator screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
              headerStyle: { backgroundColor: theme.surface },
              headerTintColor: theme.text,
              headerShadowVisible: false,
            }}>
              {!user ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                  <Stack.Screen name="PostDetail" component={PostScreen} options={{ headerShown: true, title: 'Post' }} />
                  <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} options={{ headerShown: true, title: 'Community' }} />
                  <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: true, title: 'Chat' }} />
                  <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Create Post' }} />
                  <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ headerShown: true, title: 'Saved Posts' }} />
                </>
              )}
            </Stack.Navigator>
          );
        }
      
