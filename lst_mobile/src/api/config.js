import { Platform } from 'react-native';

// Laravel dev server (`php artisan serve`) as reachable from each dev target.
// Android emulator can't see the host as `localhost`, so it uses the special
// `10.0.2.2` alias instead. Physical devices need your machine's LAN IP -
// override API_BASE_URL below with that address when testing on a real phone.
const DEV_HOST = Platform.select({
  android: '10.0.2.2',
  default: 'localhost',
});

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

if (!__DEV__ && !configuredUrl) {
  throw new Error('EXPO_PUBLIC_API_URL must be set to the production HTTPS API URL.');
}

if (!__DEV__ && !configuredUrl?.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
}

export const API_BASE_URL = configuredUrl || `http://${DEV_HOST}:8000/api`;
