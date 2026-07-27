import React from 'react';
        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
        import { useTheme } from '../context/ThemeContext';
        import Icon from 'react-native-vector-icons/Ionicons';
        import HomeScreen from '../screens/main/HomeScreen';
        import CommunitiesScreen from '../screens/main/CommunitiesScreen';
        import ChatsScreen from '../screens/main/ChatsScreen';
        import ProfileScreen from '../screens/main/ProfileScreen';

        const Tab = createBottomTabNavigator();

        export default function MainTabNavigator() {
          const { theme } = useTheme();

          return (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.tint,
                tabBarInactiveTintColor: theme.secondaryText,
                tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
                tabBarIcon: ({ color, size }) => {
                  let iconName;
                  if (route.name === 'Home') iconName = 'home-outline';
                  else if (route.name === 'Communities') iconName = 'people-outline';
                  else if (route.name === 'Chats') iconName = 'chatbubble-outline';
                  else if (route.name === 'Profile') iconName = 'person-outline';
                  return <Icon name={iconName} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Communities" component={CommunitiesScreen} />
              <Tab.Screen name="Chats" component={ChatsScreen} />
              <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
          );
        }
      