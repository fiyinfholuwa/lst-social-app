import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'lst_auth_token';
const LEGACY_AUTH_TOKEN_KEY = '@auth_token';

export const getAuthToken = async () => {
  const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (secureToken) return secureToken;

  // One-time migration for members signed in before SecureStore was introduced.
  const legacyToken = await AsyncStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
  if (!legacyToken) return null;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  return legacyToken;
};

export const setAuthToken = token => SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
};
