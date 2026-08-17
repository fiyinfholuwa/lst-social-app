import { API_BASE_URL } from './config';
import { getAuthToken, removeAuthToken } from '../utils/authTokenStorage';

let unauthorizedHandler = null;
let connectivityHandler = null;

const NORMAL_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 90000;
const SLOW_REQUEST_MS = 5000;

export const setUnauthorizedHandler = handler => {
  unauthorizedHandler = handler;
  return () => { if (unauthorizedHandler === handler) unauthorizedHandler = null; };
};

export const setConnectivityHandler = handler => {
  connectivityHandler = handler;
  return () => { if (connectivityHandler === handler) connectivityHandler = null; };
};

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const networkError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  error.isConnectivityError = true;
  return error;
};

async function request(path, { method = 'GET', body, auth = true, formData = false } = {}) {
  const headers = {
    Accept: 'application/json',
  };
  if (!formData) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const maxAttempts = method === 'GET' ? 3 : 1;
  let response;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), formData ? UPLOAD_TIMEOUT_MS : NORMAL_TIMEOUT_MS);
    const slowTimer = setTimeout(() => connectivityHandler?.('slow'), SLOW_REQUEST_MS);
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? (formData ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      connectivityHandler?.('online');
      break;
    } catch (error) {
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      const timedOut = error?.name === 'AbortError';
      connectivityHandler?.(timedOut ? 'slow' : 'offline');
      if (attempt < maxAttempts) {
        await wait(700 * attempt);
        continue;
      }
      throw networkError(
        timedOut
          ? 'The connection is taking too long. Please try again.'
          : 'You appear to be offline. Check your internet connection and try again.',
        timedOut ? 'TIMEOUT' : 'OFFLINE',
      );
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      await removeAuthToken();
      unauthorizedHandler?.();
    }
    const fallbackMessage = response.status === 413
      ? 'The selected photos are too large. Try fewer photos or smaller files.'
      : response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : `Request failed (${response.status}). Please try again.`;
    const message = data?.errors
      ? Object.values(data.errors).flat()[0]
      : data?.message || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  postForm: (path, body, options) => request(path, { ...options, method: 'POST', body, formData: true }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE', body: options.body }),
};

export default httpClient;
