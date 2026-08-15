const DEFAULT_API_URL = 'https://social.lovestraighttalks.com/api';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
const apiUrl = configuredUrl || DEFAULT_API_URL;

if (!__DEV__ && !apiUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
}

export const API_BASE_URL = apiUrl;
