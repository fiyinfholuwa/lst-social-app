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
import UserProfileScreen from '../screens/main/UserProfileScreen';
import FriendRequestsScreen from '../screens/main/FriendRequestsScreen';
import BlockedAccountsScreen from '../screens/main/BlockedAccountsScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import CommunityApplicationScreen from '../screens/main/CommunityApplicationScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import EditPostScreen from '../screens/main/EditPostScreen';
import CommunityMembersScreen from '../screens/main/CommunityMembersScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import HelpCenterScreen from '../screens/main/HelpCenterScreen';
import FeedbackScreen from '../screens/main/FeedbackScreen';
import LegalScreen from '../screens/main/LegalScreen';
import PasswordFlowScreen from '../screens/auth/PasswordFlowScreen';
import CommunityModerationScreen from '../screens/main/CommunityModerationScreen';
import SharePostScreen from '../screens/main/SharePostScreen';

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
              headerBackTitleVisible: false,
              contentStyle: { backgroundColor: theme.background },
              headerStyle: { backgroundColor: theme.surface },
              headerTintColor: theme.text,
              headerShadowVisible: false,
            }}>
              {!user ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ title: '' }} />
                  <Stack.Screen name="PostDetail" component={PostScreen} options={{ headerShown: true, title: 'Post' }} />
                  <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} options={{ headerShown: true, title: 'Community' }} />
                  <Stack.Screen name="CommunityMembers" component={CommunityMembersScreen} options={{ headerShown: true, title: 'Community Members' }} />
                  <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: true, title: 'Chat' }} />
                  <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Create Post' }} />
                  <Stack.Screen name="SharePost" component={SharePostScreen} options={{ headerShown: true, title: 'Share Post' }} />
                  <Stack.Screen name="EditPost" component={EditPostScreen} options={{ headerShown: true, title: 'Edit Post' }} />
                  <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
                  <Stack.Screen name="ChangePassword" component={PasswordFlowScreen} options={{ headerShown: true, title: 'Change Password' }} />
                  <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: true, title: 'Help Center' }} />
                  <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: true, title: 'Contact Us' }} />
                  <Stack.Screen name="Legal" component={LegalScreen} options={{ headerShown: true, title: 'Legal' }} />
                  <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ headerShown: true, title: 'Saved Posts' }} />
                  <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
                  <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ headerShown: true, title: 'Friend Requests' }} />
                  <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} options={{ headerShown: true, title: 'Blocked Accounts' }} />
                  <Stack.Screen name="Friends" component={FriendsScreen} options={{ headerShown: true, title: 'Friends' }} />
                  <Stack.Screen name="CommunityApplication" component={CommunityApplicationScreen} options={{ headerShown: true, title: 'Membership Application' }} />
                  <Stack.Screen name="CommunityModeration" component={CommunityModerationScreen} options={{ headerShown: true, title: 'Review Requests' }} />
                  <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
                </>
              )}
            </Stack.Navigator>
          );
        }
      
