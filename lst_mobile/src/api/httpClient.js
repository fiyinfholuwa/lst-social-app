import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const AUTH_TOKEN_KEY = '@auth_token';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.errors
      ? Object.values(data.errors).flat()[0]
      : data?.message || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default httpClient;
