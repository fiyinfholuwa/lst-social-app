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
                tabBarShowLabel: true,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 4 },
                tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border, height: 76, paddingTop: 8 },
                tabBarIcon: ({ color, size }) => {
                  let iconName;
                  if (route.name === 'Home') iconName = 'leaf-outline';
                  else if (route.name === 'Communities') iconName = 'people-outline';
                  else if (route.name === 'Chats') iconName = 'chatbubbles-outline';
                  else if (route.name === 'Profile') iconName = 'person-outline';
                  return <Icon name={iconName} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Today' }} />
              <Tab.Screen name="Communities" component={CommunitiesScreen} options={{ title: 'Circles' }} />
              <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: 'Messages' }} />
              <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
            </Tab.Navigator>
          );
        }
      
