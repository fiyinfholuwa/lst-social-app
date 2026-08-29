import React from 'react';
        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
        import { useTheme } from '../context/ThemeContext';
        import Icon from '../components/AppIcon';
        import HomeScreen from '../screens/main/HomeScreen';
        import CommunitiesScreen from '../screens/main/CommunitiesScreen';
        import ChatsScreen from '../screens/main/ChatsScreen';
import SermonsScreen from '../screens/main/SermonsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatUnread } from '../context/ChatUnreadContext';

        const Tab = createBottomTabNavigator();

        export default function MainTabNavigator() {
          const { theme } = useTheme();
          const insets = useSafeAreaInsets();
          const { unreadChatCount } = useChatUnread();

          return (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.secondaryText,
                tabBarShowLabel: true,
                tabBarLabelStyle: { fontSize: 9.5, fontWeight: '700', paddingBottom: 3 },
                tabBarStyle: {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 68 + insets.bottom,
                  paddingTop: 7,
                  paddingBottom: Math.max(insets.bottom, 12),
                  backgroundColor: theme.surface,
                  borderTopWidth: 1,
                  borderColor: theme.border,
                  elevation: 10,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                },
                tabBarIcon: ({ color }) => {
                  let iconName;
                  if (route.name === 'Home') iconName = 'leaf-outline';
                  else if (route.name === 'Communities') iconName = 'people-outline';
                  else if (route.name === 'Chats') iconName = 'chatbubbles-outline';
                  else if (route.name === 'Friends') iconName = 'people-outline';
                  else if (route.name === 'Sermons') iconName = 'play-circle-outline';
                  else if (route.name === 'Profile') iconName = 'person-outline';
                  return (
                    <View style={styles.iconWrap}>
                      <Icon name={iconName} size={20} strokeWidth={1.45} color={color} />
                    </View>
                  );
                },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Today' }} />
              <Tab.Screen name="Communities" component={CommunitiesScreen} options={{ title: 'Circles' }} />
              <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: 'Messages', tabBarBadge: unreadChatCount || undefined, tabBarBadgeStyle: { backgroundColor: theme.accent, color: '#FFFFFF', fontSize: 9 } }} />
              <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
              <Tab.Screen name="Sermons" component={SermonsScreen} options={{ title: 'Sermons' }} />
              <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
            </Tab.Navigator>
          );
        }

        const styles = StyleSheet.create({
          iconWrap: {
            width: 34,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
          },
        });
      
