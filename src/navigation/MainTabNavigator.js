import React from 'react';
        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
        import { useTheme } from '../context/ThemeContext';
        import Icon from '../components/AppIcon';
        import HomeScreen from '../screens/main/HomeScreen';
        import CommunitiesScreen from '../screens/main/CommunitiesScreen';
        import ChatsScreen from '../screens/main/ChatsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { StyleSheet, View } from 'react-native';

        const Tab = createBottomTabNavigator();

        export default function MainTabNavigator() {
          const { theme } = useTheme();

          return (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.secondaryText,
                tabBarShowLabel: true,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 7 },
                tabBarStyle: {
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: 10,
                  height: 72,
                  paddingTop: 7,
                  backgroundColor: theme.surface,
                  borderTopWidth: 0,
                  borderRadius: 22,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.12,
                  shadowRadius: 14,
                  elevation: 10,
                },
                tabBarItemStyle: { borderRadius: 18 },
                tabBarIcon: ({ color, size, focused }) => {
                  let iconName;
                  if (route.name === 'Home') iconName = 'leaf-outline';
                  else if (route.name === 'Communities') iconName = 'people-outline';
                  else if (route.name === 'Chats') iconName = 'chatbubbles-outline';
                  else if (route.name === 'Profile') iconName = 'person-outline';
                  return (
                    <View style={[
                      styles.iconWrap,
                      focused && { backgroundColor: theme.accentSoft },
                    ]}>
                      <Icon name={iconName} size={focused ? 20 : 18} color={color} solid />
                      {focused ? <View style={[styles.activeDot, { backgroundColor: theme.accent }]} /> : null}
                    </View>
                  );
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

        const styles = StyleSheet.create({
          iconWrap: {
            width: 42,
            height: 32,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          },
          activeDot: {
            position: 'absolute',
            bottom: 2,
            width: 4,
            height: 4,
            borderRadius: 2,
          },
        });
      
