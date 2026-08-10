import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiService from '../api/apiService';

const PUSH_TOKEN_KEY = '@expo_push_token';

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D62839',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Expo project ID is not configured.');
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
};

export const storePushToken = async token => {
  await apiService.registerPushToken({
    token,
    platform: Platform.OS,
    device_name: Device.deviceName || Device.modelName || null,
  });
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
};

export const unregisterCurrentPushToken = async () => {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  await apiService.removePushToken(token);
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
};
