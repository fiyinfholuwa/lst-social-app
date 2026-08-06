import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const AUTH_TOKEN_KEY = '@auth_token';

async function request(path, { method = 'GET', body, auth = true, formData = false } = {}) {
  const headers = {
    Accept: 'application/json',
  };
  if (!formData) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (formData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const fallbackMessage = response.status === 413
      ? 'The selected photos are too large. Try fewer photos or smaller files.'
      : response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : `Request failed (${response.status}). Please try again.`;
    const message = data?.errors
      ? Object.values(data.errors).flat()[0]
      : data?.message || fallbackMessage;
    throw new Error(message);
  }

  return data;
}

const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  postForm: (path, body, options) => request(path, { ...options, method: 'POST', body, formData: true }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default httpClient;
